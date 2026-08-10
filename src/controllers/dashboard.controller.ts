/**
 * FPRD-20: Student Dashboard Controller
 * Adds three minimal endpoints required by the new dashboard UI:
 *   GET /api/dashboard/daily-tasks   — today's lesson + coding challenge
 *   GET /api/dashboard/activity      — contribution heatmap data
 *   GET /api/leaderboard             — XP-based ranking
 *
 * NOTE: The old roadmap/lesson system (lesson_progress, lessons, roadmaps tables)
 * still physically exists in production — those tables were created by migration
 * 20260715123406_learning_ecosystem and were never dropped.
 * However, Prisma Client no longer has models for them (removed from schema.prisma).
 * We use prisma.$queryRaw for any queries against those legacy tables.
 *
 * The new Learning CMS uses: LearningProgress, LearningContent, Course, Level.
 */

import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/database';

// ─── GET /api/dashboard/daily-tasks ─────────────────────────────────────────

export const getDailyTasks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    // Today's coding challenge
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    const tomorrowUTC = new Date(todayUTC);
    tomorrowUTC.setUTCDate(todayUTC.getUTCDate() + 1);

    // Fetch today's coding challenge from the new CMS (first published content for today)
    // and fall back to the daily_challenge table
    const [dailyChallengeRow, continueLearning] = await Promise.all([
      prisma.dailyChallenge.findFirst({
        where: {
          challengeDate: { gte: todayUTC, lt: tomorrowUTC },
        },
        include: {
          problem: {
            select: { id: true, title: true, slug: true, difficulty: true },
          },
        },
      }),
      // New CMS: find the user's most recently accessed IN_PROGRESS content
      prisma.learningProgress.findFirst({
        where: { userId, status: 'IN_PROGRESS' },
        orderBy: { lastAccessedAt: 'desc' },
        include: {
          content: {
            select: {
              id: true,
              topicName: true,
              slug: true,
              courseId: true,
              levelId: true,
            },
          },
        },
      }),
    ]);

    // Check if today's coding challenge is already solved by this user
    let codingChallengeSolved = false;
    if (dailyChallengeRow?.problem?.id && userId) {
      const accepted = await prisma.submission.findFirst({
        where: {
          userId,
          problemId: dailyChallengeRow.problem.id,
          status: 'ACCEPTED',
          submittedAt: { gte: todayUTC },
        },
        select: { id: true },
      });
      codingChallengeSolved = !!accepted;
    }

    const difficulty = dailyChallengeRow?.problem?.difficulty;
    const difficultyLabel =
      difficulty === 'EASY' ? 'Easy'
      : difficulty === 'MEDIUM' ? 'Medium'
      : difficulty === 'HARD' ? 'Hard'
      : 'Easy';

    sendSuccess(res, 'Daily tasks fetched', {
      codingChallenge: dailyChallengeRow?.problem
        ? {
            id: dailyChallengeRow.problem.id,
            title: dailyChallengeRow.problem.title,
            slug: dailyChallengeRow.problem.slug,
            difficulty: difficultyLabel,
            completed: codingChallengeSolved,
          }
        : null,
      lesson: continueLearning?.content
        ? {
            id: continueLearning.content.id,
            title: continueLearning.content.topicName,
            slug: continueLearning.content.slug,
            completed: false,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/dashboard/activity ─────────────────────────────────────────────

export const getDashboardActivity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : new Date().getFullYear();

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    // Aggregate activity counts per calendar day from multiple event sources:
    // 1) New CMS Learning completions (LearningProgress with status=COMPLETED)
    // 2) Accepted submissions (Submission with status=ACCEPTED)
    // 3) Daily logins (UserAnalytics.lastLogin — one per day)
    const [learningCompletions, acceptedSubmissions, analyticsRow] = await Promise.all([
      prisma.learningProgress.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: startDate, lt: endDate },
        },
        select: { completedAt: true },
      }),

      prisma.submission.findMany({
        where: {
          userId,
          status: 'ACCEPTED',
          submittedAt: { gte: startDate, lt: endDate },
        },
        select: { submittedAt: true },
      }),

      prisma.userAnalytics.findUnique({
        where: { userId },
        select: { lastLogin: true },
      }),
    ]);

    // Build day-keyed activity map
    const activityMap = new Map<string, number>();

    const addDay = (date: Date | null | undefined) => {
      if (!date) return;
      const key = date.toISOString().slice(0, 10);
      activityMap.set(key, (activityMap.get(key) ?? 0) + 1);
    };

    learningCompletions.forEach((p) => addDay(p.completedAt));
    acceptedSubmissions.forEach((s) => addDay(s.submittedAt));

    if (analyticsRow?.lastLogin) {
      const loginKey = analyticsRow.lastLogin.toISOString().slice(0, 10);
      const loginYear = new Date(analyticsRow.lastLogin).getFullYear();
      if (loginYear === year) {
        activityMap.set(loginKey, (activityMap.get(loginKey) ?? 0) + 1);
      }
    }

    const result = Array.from(activityMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    sendSuccess(res, 'Activity heatmap fetched', result);
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/leaderboard ─────────────────────────────────────────────────────

export const getLeaderboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const LIMIT = 50;

    // XP = (completed learning content × 10) + (accepted problems × 20)
    const [topBySubmissions, topByLearning] = await Promise.all([
      prisma.submission.groupBy({
        by: ['userId'],
        where: { status: 'ACCEPTED' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: LIMIT * 2,
      }),
      prisma.learningProgress.groupBy({
        by: ['userId'],
        where: { status: 'COMPLETED' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: LIMIT * 2,
      }),
    ]);

    const allUserIds = new Set<string>([
      ...topBySubmissions.map((r) => r.userId),
      ...topByLearning.map((r) => r.userId),
      userId,
    ]);

    const xpMap = new Map<string, number>();
    topBySubmissions.forEach((r) => {
      xpMap.set(r.userId, (xpMap.get(r.userId) ?? 0) + r._count.id * 20);
    });
    topByLearning.forEach((r) => {
      xpMap.set(r.userId, (xpMap.get(r.userId) ?? 0) + r._count.id * 10);
    });

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(allUserIds) } },
      select: { id: true, fullName: true, profileImage: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const sorted = Array.from(allUserIds)
      .map((uid) => ({
        userId: uid,
        xp: xpMap.get(uid) ?? 0,
        user: userMap.get(uid),
      }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, LIMIT);

    const entries = sorted.map((entry, idx) => ({
      rank: idx + 1,
      userId: entry.userId,
      fullName: entry.user?.fullName ?? 'Unknown',
      xp: entry.xp,
      profileImage: entry.user?.profileImage ?? null,
    }));

    let currentUserRank = entries.findIndex((e) => e.userId === userId) + 1;
    const currentUserXp = xpMap.get(userId) ?? 0;

    if (currentUserRank === 0) {
      const usersAheadCount = sorted.filter((e) => e.xp > currentUserXp).length;
      currentUserRank = usersAheadCount + 1;
    }

    const totalUsers = await prisma.user.count({ where: { role: 'STUDENT' } });

    sendSuccess(res, 'Leaderboard fetched', {
      entries,
      currentUserRank,
      currentUserXp,
      totalUsers,
    });
  } catch (error) {
    next(error);
  }
};
