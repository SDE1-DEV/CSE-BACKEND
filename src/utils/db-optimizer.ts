/**
 * Database Optimization Utilities
 * PRD-06: Section 14 — Database Optimization
 *
 * - N+1 query detection helpers
 * - Batch operation wrappers
 * - Connection pool config docs
 * - Index usage notes
 */

import { prisma } from '../config/database';
import { logger } from './logger';

/**
 * Execute operations in batches to avoid overwhelming the DB.
 * Useful for bulk inserts, bulk updates, etc.
 */
export const batchOperation = async <T>(
  items: T[],
  batchSize: number,
  fn: (batch: T[]) => Promise<void>,
): Promise<void> => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await fn(batch);
    logger.debug(`Batch processed: ${i + batch.length}/${items.length}`);
  }
};

/**
 * Wrap a Prisma call with duration logging and metrics.
 */
export const timedQuery = async <T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    if (duration > 200) {
      logger.warn(`Slow query: ${label}`, { duration_ms: duration });
    }
    return result;
  } catch (err) {
    logger.error(`Query error: ${label}`, { error: (err as Error).message });
    throw err;
  }
};

/**
 * Health check — verifies DB is reachable and reports pool info.
 */
export const getDatabaseHealth = async (): Promise<{
  status: string;
  responseTime_ms: number;
  version?: string;
}> => {
  const start = Date.now();
  try {
    const result = await prisma.$queryRaw<[{ version: string }]>`SELECT version()`;
    return {
      status: 'healthy',
      responseTime_ms: Date.now() - start,
      version: result[0]?.version?.split(' ')[1],
    };
  } catch {
    return {
      status: 'unhealthy',
      responseTime_ms: Date.now() - start,
    };
  }
};

/*
 * ── Connection Pool Notes ─────────────────────────────────────────────────────
 *
 * Prisma uses a connection pool managed by the driver adapter or built-in pool.
 * For Supabase (pgBouncer), the DATABASE_URL already uses transaction pooling.
 *
 * Recommended pool size for production:
 *   - Formula: (num_cpu_cores * 2) + num_spindle_disks
 *   - For a 2-core server: 5–10 connections
 *   - Set via: DATABASE_URL="...?connection_limit=10&pool_timeout=20"
 *
 * ── Composite Index Recommendations ──────────────────────────────────────────
 *
 * The following composite indexes are recommended but managed via Prisma schema:
 *
 * (Already added in schema.prisma via @@index directives)
 *
 * Additional candidate indexes for high-traffic queries:
 *   - submissions: (userId, problemId, submittedAt)
 *   - notifications: (userId, isRead, createdAt)
 *   - lesson_progress: (userId, completed)
 *   - job_applications: (userId, status)
 *
 * ── N+1 Query Patterns to Avoid ──────────────────────────────────────────────
 *
 * BAD:  for (const team of teams) { const members = await getMembers(team.id) }
 * GOOD: include: { members: true } in the original query
 *
 * BAD:  for (const user of users) { await createNotification(user.id) }
 * GOOD: Use the notification queue with batch enqueue
 */
