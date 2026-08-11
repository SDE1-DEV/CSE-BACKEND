/**
 * Server Entry Point
 * PRD-06: Full production startup sequence
 * - Environment validation
 * - Database connection
 * - Redis connection
 * - WebSocket gateway
 * - Queue workers
 * - Scheduled jobs
 * - Graceful shutdown
 */

import 'dotenv/config';
import http from 'http';
import app from './app';
import { env, validateEnv } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { getRedisClient, disconnectRedis } from './config/redis';
import { logger } from './utils/logger';
import { runBootstrap } from './bootstrap';
import { validateStorageBuckets } from './config/supabase';
import { registerActivityListeners } from './events/activity-listener';
import { registerNotificationListeners } from './events/notification-listener';
import { wsGateway } from './websocket/gateway';
import { startEmailWorker } from './queues/email.queue';
import { startNotificationWorker } from './queues/notification.queue';
import { startAnalyticsWorker } from './queues/analytics.queue';
import { startCleanupWorker } from './queues/cleanup.queue';
import { closeAllQueues } from './queues/queue.config';
import { startScheduler, stopScheduler } from './jobs/scheduler';

/**
 * Verifies the Learning CMS database tables are accessible after migration.
 * Also checks that the legacy lesson_progress table exists (required by
 * /api/learning/stats and related endpoints).
 * Logs database host/name for environment verification without exposing credentials.
 * This prevents the server from starting against an incomplete schema.
 * Called once after connectDatabase(), before bootstrap.
 *
 * PRD-FINAL-01 §50: startup database verification.
 * PRD-FINAL-01 §49: safe environment diagnostic logging.
 */
async function verifyLearningCmsSchema(): Promise<void> {
  const { prisma } = await import('./config/database');

  // ── Log database environment (safe — no passwords/secrets) ─────────────────
  try {
    const dbInfo = await prisma.$queryRaw<{ db: string; schema: string; user: string }[]>`
      SELECT current_database() AS db, current_schema() AS schema, current_user AS "user"
    `;
    if (dbInfo[0]) {
      logger.info('Database environment', {
        database: dbInfo[0].db,
        schema: dbInfo[0].schema,
        user: dbInfo[0].user,
        // Do NOT log full DATABASE_URL, password, JWT_SECRET, or service role key
      });
    }
  } catch (err) {
    logger.warn('Could not query database environment info', { error: (err as Error).message });
  }

  // ── New CMS table checks — failure aborts startup ───────────────────────────
  const tables = [
    { name: 'courses',               check: () => prisma.course.count() },
    { name: 'levels',                check: () => prisma.level.count() },
    { name: 'learning_contents',     check: () => prisma.learningContent.count() },
    { name: 'learning_note_images',  check: () => prisma.learningNoteImage.count() },
    { name: 'learning_progress',     check: () => prisma.learningProgress.count() },
  ];

  const failed: string[] = [];

  for (const t of tables) {
    try {
      await t.check();
      logger.info(`✓ Schema check passed: ${t.name}`);
    } catch (err) {
      logger.error(`✗ Schema check FAILED: ${t.name}`, { error: (err as Error).message });
      failed.push(t.name);
    }
  }

  if (failed.length > 0) {
    logger.error(
      'LEARNING_CMS_SCHEMA_CHECK_FAILED — the following tables are missing: ' +
      failed.join(', ') +
      '. Run: npx prisma migrate deploy',
    );
    process.exit(1);
  }

  // ── Legacy table check — warning only, not a blocker ────────────────────────
  // lesson_progress is expected to exist after migration 20260715123406 or
  // 20260811000000_lesson_progress_schema_alignment.
  try {
    const legacyCheck = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'lesson_progress'
      ) AS exists
    `;
    if (legacyCheck[0]?.exists) {
      logger.info('✓ Schema check passed: lesson_progress (legacy)');
    } else {
      logger.warn(
        '⚠ lesson_progress table is ABSENT — /api/learning/stats will return legacy zeros. ' +
        'Run: npx prisma migrate deploy to apply migration 20260811000000_lesson_progress_schema_alignment',
      );
    }
  } catch (err) {
    logger.warn('Could not check for lesson_progress table', { error: (err as Error).message });
  }

  logger.info('✓ All Learning CMS schema tables verified successfully');
}

const startServer = async (): Promise<void> => {
  try {
    // 1. Validate environment variables
    validateEnv();
    logger.info('Environment variables validated');

    // 2. Connect to database
    await connectDatabase();

    // 2.5. Verify Learning CMS schema is accessible (fail fast if migration not applied)
    await verifyLearningCmsSchema();

    // 3. Run bootstrap (creates SUPER_ADMIN if none exists)
    await runBootstrap();

    // 4. Validate Supabase storage buckets (auto-create in development)
    await validateStorageBuckets();

    // 5. Connect to Redis (non-blocking — graceful fallback if unavailable)
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.ping();
        logger.info('Redis connected');
      } catch {
        logger.warn('Redis unavailable — caching and queues will operate in fallback mode');
      }
    } else {
      logger.warn('Redis not configured — caching and queues will operate in fallback mode');
    }

    // 6. Register domain event listeners
    registerActivityListeners();
    registerNotificationListeners();
    logger.info('Event listeners registered');

    // 7. Create HTTP server
    const server = http.createServer(app);

    // 8. Initialize WebSocket gateway
    wsGateway.initialize(server);

    // 9. Start queue workers (only in non-test environments)
    if (!env.isTest()) {
      startEmailWorker();
      startNotificationWorker();
      startAnalyticsWorker();
      startCleanupWorker();

      // FPRD-17: Start judge worker for async code execution
      if (process.env['EXECUTION_ENGINE'] !== 'mock') {
        const { startJudgeWorker } = await import('./queues/judge.queue');
        startJudgeWorker();
      }

      logger.info('Queue workers started');
    }

    // 10. Start cron scheduler
    if (!env.isTest()) {
      startScheduler();
    }

    // 11. Start listening
    server.listen(env.PORT, () => {
      logger.info('Server started successfully', {
        port: env.PORT,
        environment: env.NODE_ENV,
        docs: `http://localhost:${env.PORT}/api/docs`,
        health: `http://localhost:${env.PORT}/api/v1/health`,
        metrics: `http://localhost:${env.PORT}/api/v1/health/metrics`,
      });
    });

    // ── Graceful Shutdown ──────────────────────────────────────────────────────
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received — shutting down gracefully`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          stopScheduler();
          await closeAllQueues();
          await disconnectDatabase();
          await disconnectRedis();
        } catch (err) {
          logger.error('Error during shutdown', { error: (err as Error).message });
        }

        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force exit after 30s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30_000);
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection', { reason });
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

void startServer();
