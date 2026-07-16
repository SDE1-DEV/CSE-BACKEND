/**
 * Database Configuration
 * PRD-06: Section 14 — Database Optimization
 * - Connection pooling via Prisma
 * - Slow query logging (>200ms)
 * - DB health checks
 */

import { PrismaClient } from '@prisma/client';
import { logger, logSlowQuery } from '../utils/logger';
import { metricsService } from '../services/metrics.service';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

// ── Query monitoring ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$on('query', (e: { query: string; duration: number }) => {
  logSlowQuery(e.query, e.duration);
  metricsService.recordDbQuery('query', e.duration);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$on('error', (e: { message: string; target: string }) => {
  logger.error('Prisma query error', { message: e.message, target: e.target });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$on('warn', (e: { message: string }) => {
  logger.warn('Prisma warning', { message: e.message });
});

if (process.env['NODE_ENV'] !== 'production') globalForPrisma.prisma = prisma;

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed', { error });
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};
