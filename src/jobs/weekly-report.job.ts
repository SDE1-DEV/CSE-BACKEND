/**
 * Weekly Learning Report Job
 * Sends weekly learning summary emails to all verified users.
 */

import { prisma } from '../config/database';
import { enqueueEmail } from '../queues/email.queue';
import { logger } from '../utils/logger';

export const sendWeeklyReports = async (): Promise<void> => {
  logger.info('Weekly report job started');

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get all verified users
  const users = await prisma.user.findMany({
    where: { isVerified: true },
    select: { id: true, email: true, fullName: true },
  });

  let enqueued = 0;

  for (const user of users) {
    try {
      // Get their progress for the past week
      const progress = await prisma.userProgress.findMany({
        where: {
          userId: user.id,
          updatedAt: { gte: oneWeekAgo },
          completed: true,
        },
      });

      // Only send if they were active
      if (progress.length === 0) continue;

      const totalMinutes = progress.reduce((sum: number, p: { timeSpent?: number }) => sum + (p.timeSpent ?? 0), 0);

      await enqueueEmail({
        type: 'email:weekly-summary',
        to: user.email,
        payload: {
          userName: user.fullName,
          lessonsCompleted: progress.length,
          minutesStudied: totalMinutes,
        },
      });

      enqueued++;
    } catch (err) {
      logger.error('Failed to enqueue weekly report for user', {
        userId: user.id,
        error: (err as Error).message,
      });
    }
  }

  logger.info('Weekly report job completed', { totalEnqueued: enqueued, totalUsers: users.length });
};
