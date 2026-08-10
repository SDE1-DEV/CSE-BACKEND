/**
 * Weekly Learning Report Job
 * Sends weekly learning summary emails to all verified users.
 *
 * Uses the new LearningProgress model for activity data.
 * Legacy lesson_progress is queried via raw SQL for backwards-compat.
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
      // Check new CMS learning progress (LearningProgress model)
      const cmsCompleted = await prisma.learningProgress.count({
        where: {
          userId: user.id,
          status: 'COMPLETED',
          completedAt: { gte: oneWeekAgo },
        },
      });

      // Also check legacy lesson_progress via raw SQL
      const legacyRows = await prisma.$queryRaw<{ time_spent: number }[]>`
        SELECT COALESCE("timeSpent", 0) AS time_spent
        FROM "lesson_progress"
        WHERE "userId" = ${user.id}
          AND "updatedAt" >= ${oneWeekAgo}
          AND completed = true
      `;

      const totalCompleted = cmsCompleted + legacyRows.length;

      // Only send if they were active this week
      if (totalCompleted === 0) continue;

      const totalMinutes = legacyRows.reduce((sum, p) => sum + (Number(p.time_spent) || 0), 0);

      await enqueueEmail({
        type: 'email:weekly-summary',
        to: user.email,
        payload: {
          userName: user.fullName,
          lessonsCompleted: totalCompleted,
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
