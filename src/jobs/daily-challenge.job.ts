/**
 * Daily Challenge Generation Job
 * Automatically selects a problem for the next day if none is set.
 */

import { prisma } from '../config/database';
import { cacheService, CacheKeys } from '../services/cache.service';
import { logger } from '../utils/logger';

export const generateDailyChallenge = async (): Promise<void> => {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  // Check if tomorrow's challenge already exists
  const existing = await prisma.dailyChallenge.findFirst({
    where: {
      challengeDate: tomorrow,
    },
  });

  if (existing) {
    logger.info('Daily challenge for tomorrow already set', { date: tomorrow.toISOString() });
    return;
  }

  // Pick a random published problem that hasn't been used recently (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentProblemIds = await prisma.dailyChallenge.findMany({
    where: { challengeDate: { gte: thirtyDaysAgo } },
    select: { problemId: true },
  });

  const excludeIds = recentProblemIds.map((c) => c.problemId);

  const problem = await prisma.codingProblem.findFirst({
    where: {
      isPublished: true,
      id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
    },
    orderBy: { acceptanceRate: 'asc' },
  });

  if (!problem) {
    logger.warn('No eligible problem found for daily challenge');
    return;
  }

  await prisma.dailyChallenge.create({
    data: {
      problemId: problem.id,
      challengeDate: tomorrow,
      bonusXP: 50,
    },
  });

  // Invalidate daily challenge cache
  await cacheService.del(CacheKeys.DAILY_CHALLENGE());

  logger.info('Daily challenge generated', {
    problemId: problem.id,
    problemTitle: problem.title,
    date: tomorrow.toISOString(),
  });
};
