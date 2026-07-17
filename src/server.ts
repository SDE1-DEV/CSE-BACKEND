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
import { registerActivityListeners } from './events/activity-listener';
import { registerNotificationListeners } from './events/notification-listener';
import { wsGateway } from './websocket/gateway';
import { startEmailWorker } from './queues/email.queue';
import { startNotificationWorker } from './queues/notification.queue';
import { startAnalyticsWorker } from './queues/analytics.queue';
import { startCleanupWorker } from './queues/cleanup.queue';
import { closeAllQueues } from './queues/queue.config';
import { startScheduler, stopScheduler } from './jobs/scheduler';

const startServer = async (): Promise<void> => {
  try {
    // 1. Validate environment variables
    validateEnv();
    logger.info('Environment variables validated');

    // 2. Connect to database
    await connectDatabase();

    // 3. Run bootstrap (creates SUPER_ADMIN if none exists)
    await runBootstrap();

    // 4. Connect to Redis (non-blocking — graceful fallback if unavailable)
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

    // 5. Register domain event listeners
    registerActivityListeners();
    registerNotificationListeners();
    logger.info('Event listeners registered');

    // 5. Create HTTP server
    const server = http.createServer(app);

    // 6. Initialize WebSocket gateway
    wsGateway.initialize(server);

    // 7. Start queue workers (only in non-test environments)
    if (!env.isTest()) {
      startEmailWorker();
      startNotificationWorker();
      startAnalyticsWorker();
      startCleanupWorker();
      logger.info('Queue workers started');
    }

    // 8. Start cron scheduler
    if (!env.isTest()) {
      startScheduler();
    }

    // 9. Start listening
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
