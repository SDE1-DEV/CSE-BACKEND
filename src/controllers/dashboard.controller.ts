/**
 * FPRD-20: Student Dashboard Controller
 * Adds three minimal endpoints required by the new dashboard UI:
 *   GET /api/dashboard/daily-tasks   — today's lesson + coding challenge
 *   GET /api/dashboard/activity      — contribution heatmap data
 *   GET /api/leaderboard             — XP-based ranking
 *
 * Rules: no changes to existing controllers, services, or models.
 * All queries are read-only Prisma calls against existing tables.
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
      prisma.userProgress.findFirst({
        where: { userId, completed: false },
        orderBy: { updatedAt: 'desc' },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              section: {
                select: {
                  roadmap: { select: { slug: true } },
                },
              },
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

    // Check if today's lesson is already completed
    let lessonCompleted = false;
    if (continueLearning?.lesson?.id) {
      const progress = await prisma.userProgress.findFirst({
        where: { userId, lessonId: continueLearning.lesson.id, completed: true },
        select: { id: true },
      });
      lessonCompleted = !!progress;
    }

    const difficulty = dailyChallengeRow?.problem?.difficulty;
    // Map Prisma enum (EASY/MEDIUM/HARD) to title-case for frontend
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
      lesson: continueLearning?.lesson
        ? {
            id: continueLearning.lesson.id,
            title: continueLearning.lesson.title,
            roadmapSlug: continueLearning.lesson.section?.roadmap?.slug ?? null,
            completed: lessonCompleted,
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
    // 1) Lesson completions (UserProgress with completed=true)
    // 2) Accepted submissions (Submission with status=ACCEPTED)
    // 3) Daily logins (UserAnalytics.lastLogin — one per day)
    // 4) Quiz completions (QuizAttempt if table exists)

    const [lessonProgress, acceptedSubmissions, analyticsRow] = await Promise.all([
      prisma.userProgress.findMany({
        where: {
          userId,
          completed: true,
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
      const key = date.toISOString().slice(0, 10); // "YYYY-MM-DD"
      activityMap.set(key, (activityMap.get(key) ?? 0) + 1);
    };

    lessonProgress.forEach((p) => addDay(p.completedAt));
    acceptedSubmissions.forEach((s) => addDay(s.submittedAt));

    // Count today's login as one activity if lastLogin is today
    if (analyticsRow?.lastLogin) {
      const loginKey = analyticsRow.lastLogin.toISOString().slice(0, 10);
      const loginYear = new Date(analyticsRow.lastLogin).getFullYear();
      if (loginYear === year) {
        activityMap.set(loginKey, (activityMap.get(loginKey) ?? 0) + 1);
      }
    }

    // Serialize to array sorted by date
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

    // XP = (completed lessons × 10) + (accepted problems × 20)
    // We compute this entirely from existing tables — no new columns needed.
    const LIMIT = 50;

    // Get top users by accepted submission count + completed lessons
    const [topBySubmissions, topByLessons] = await Promise.all([
      prisma.submission.groupBy({
        by: ['userId'],
        where: { status: 'ACCEPTED' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: LIMIT * 2,
      }),
      prisma.userProgress.groupBy({
        by: ['userId'],
        where: { completed: true },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: LIMIT * 2,
      }),
    ]);

    // Merge all userIds found
    const allUserIds = new Set<string>([
      ...topBySubmissions.map((r) => r.userId),
      ...topByLessons.map((r) => r.userId),
      userId, // always include the current user
    ]);

    // Build xp map
    const xpMap = new Map<string, number>();
    topBySubmissions.forEach((r) => {
      xpMap.set(r.userId, (xpMap.get(r.userId) ?? 0) + r._count.id * 20);
    });
    topByLessons.forEach((r) => {
      xpMap.set(r.userId, (xpMap.get(r.userId) ?? 0) + r._count.id * 10);
    });

    // Fetch user names + avatars for all relevant users
    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(allUserIds) } },
      select: { id: true, fullName: true, profileImage: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Sort by XP descending, take top LIMIT
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

    // Find current user rank (may be outside top LIMIT)
    let currentUserRank = entries.findIndex((e) => e.userId === userId) + 1;
    let currentUserXp = xpMap.get(userId) ?? 0;

    if (currentUserRank === 0) {
      // User is outside top LIMIT — count how many users have more XP
      const usersAheadCount = sorted.filter((e) => e.xp > currentUserXp).length;
      currentUserRank = usersAheadCount + 1;
    }

    // Total user count from DB
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
