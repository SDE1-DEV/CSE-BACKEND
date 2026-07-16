/**
 * Cleanup Queue — stale data removal jobs
 * PRD-06: Section 2 — Background Job Queue
 */

import { Job } from 'bullmq';
import { createQueue, createWorker, QUEUE_NAMES } from './queue.config';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface CleanupJobData {
  type:
    | 'cleanup:expired-otps'
    | 'cleanup:expired-invitations'
    | 'cleanup:expired-events'
    | 'cleanup:stale-notifications'
    | 'cleanup:expired-tokens'
    | 'cleanup:expired-manager-invitations'; // PRD-07
}

export const cleanupQueue = createQueue(QUEUE_NAMES.CLEANUP);

export const enqueueCleanup = async (type: CleanupJobData['type']): Promise<void> => {
  try {
    await cleanupQueue.add(type, { type });
  } catch (err) {
    logger.error('Failed to enqueue cleanup job', { type, error: (err as Error).message });
  }
};

const processCleanupJob = async (job: Job<CleanupJobData>): Promise<void> => {
  const { type } = job.data;
  logger.info('Starting cleanup job', { type });

  switch (type) {
    case 'cleanup:expired-otps': {
      const deleted = await prisma.$transaction([
        prisma.emailVerification.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
        prisma.passwordReset.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      ]);
      logger.info('Cleaned expired OTPs', { emailVerif: deleted[0].count, passwordReset: deleted[1].count });
      break;
    }

    case 'cleanup:expired-invitations': {
      const result = await prisma.teamInvitation.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: new Date() },
        },
        data: { status: 'EXPIRED' },
      });
      logger.info('Expired invitations cleaned', { count: result.count });
      break;
    }

    case 'cleanup:expired-events': {
      const result = await prisma.event.updateMany({
        where: {
          endTime: { lt: new Date() },
          isPublished: true,
        },
        data: { isPublished: false },
      });
      logger.info('Archived expired events', { count: result.count });
      break;
    }

    case 'cleanup:stale-notifications': {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: { lt: thirtyDaysAgo },
        },
      });
      logger.info('Cleaned stale notifications', { count: result.count });
      break;
    }

    case 'cleanup:expired-tokens': {
      const result = await prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      logger.info('Cleaned expired refresh tokens', { count: result.count });
      break;
    }

    // PRD-07: Expire pending manager invitations
    case 'cleanup:expired-manager-invitations': {
      const result = await prisma.managerInvitation.updateMany({
        where: { status: 'PENDING', expiresAt: { lt: new Date() } },
        data: { status: 'EXPIRED' },
      });
      logger.info('Expired manager invitations cleaned', { count: result.count });
      break;
    }

    default:
      logger.warn('Unknown cleanup job type', { type });
  }
};

export const startCleanupWorker = (): void => {
  createWorker<CleanupJobData>(QUEUE_NAMES.CLEANUP, processCleanupJob, 1);
  logger.info('Cleanup worker started');
};
