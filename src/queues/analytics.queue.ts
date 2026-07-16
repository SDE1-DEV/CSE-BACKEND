/**
 * Analytics Aggregation Queue
 * PRD-06: Section 2 — Background Job Queue
 */

import { Job } from 'bullmq';
import { createQueue, createWorker, QUEUE_NAMES } from './queue.config';
import { prisma } from '../config/database';
import { cacheService, CacheKeys } from '../services/cache.service';
import { logger } from '../utils/logger';

export interface AnalyticsJobData {
  type: 'analytics:aggregate-user' | 'analytics:refresh-admin';
  userId?: string;
}

export const analyticsQueue = createQueue(QUEUE_NAMES.ANALYTICS);

export const enqueueAnalytics = async (data: AnalyticsJobData): Promise<void> => {
  try {
    await analyticsQueue.add(data.type, data, {
      jobId: data.userId ? `${data.type}:${data.userId}` : data.type,
      // deduplicate: only one job of this type per user in queue
    });
  } catch (err) {
    logger.error('Failed to enqueue analytics job', { error: (err as Error).message });
  }
};

const processAnalyticsJob = async (job: Job<AnalyticsJobData>): Promise<void> => {
  switch (job.data.type) {
    case 'analytics:aggregate-user': {
      const userId = job.data.userId;
      if (!userId) return;

      // Refresh user analytics cache
      const analytics = await prisma.userAnalytics.findUnique({ where: { userId } });
      if (analytics) {
        await cacheService.set(CacheKeys.USER_ANALYTICS(userId), analytics);
      }
      break;
    }
    case 'analytics:refresh-admin': {
      // Clear admin dashboard cache so it regenerates on next request
      await cacheService.del(CacheKeys.ADMIN_DASHBOARD);
      break;
    }
    default:
      logger.warn('Unknown analytics job type', { type: job.data.type });
  }
};

export const startAnalyticsWorker = (): void => {
  createWorker<AnalyticsJobData>(QUEUE_NAMES.ANALYTICS, processAnalyticsJob, 2);
  logger.info('Analytics worker started');
};
