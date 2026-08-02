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
  // Skip noisy Prisma internal queries (BEGIN, COMMIT, DEALLOCATE) from the slow-query log
  const q = (e.query ?? '').trim().toUpperCase();
  const isNoise = q === 'BEGIN' || q === 'COMMIT' || q === 'ROLLBACK' || q.startsWith('DEALLOCATE');
  if (!isNoise) {
    logSlowQuery(e.query, e.duration);
  }
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

// ── FPRD-11: Global soft-delete filter ─────────────────────────────────────────
// Models carrying a `deletedAt` column. All top-level read operations transparently
// exclude soft-deleted rows so student-facing and manager list/detail endpoints never
// surface trashed content. Callers that set `deletedAt` explicitly in their `where`
// (e.g. the trash/restore views) opt out of the filter.
const SOFT_DELETE_MODELS = new Set<string>([
  'Category', 'Roadmap', 'RoadmapSection', 'Lesson', 'LearningResource',
  'ProblemCategory', 'CodingProblem', 'ProjectCategory', 'Project',
  'Company', 'JobPosting', 'Event', 'Banner', 'Faq', 'Testimonial', 'MediaFile',
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$use(async (params: any, next: (p: any) => Promise<unknown>) => {
  if (params.model && SOFT_DELETE_MODELS.has(params.model)) {
    const action: string = params.action;
    if (action === 'findUnique' || action === 'findUniqueOrThrow') {
      params.action = action === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
      params.args = params.args ?? {};
      params.args.where = params.args.where ?? {};
      if (params.args.where.deletedAt === undefined) params.args.where.deletedAt = null;
    } else if (
      action === 'findFirst' || action === 'findFirstOrThrow' || action === 'findMany' ||
      action === 'count' || action === 'aggregate' || action === 'groupBy'
    ) {
      params.args = params.args ?? {};
      params.args.where = params.args.where ?? {};
      if (params.args.where.deletedAt === undefined) params.args.where.deletedAt = null;
    }
  }
  return next(params);
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
