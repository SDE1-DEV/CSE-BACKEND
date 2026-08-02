/**
 * FPRD-17 Phase 21 — User Topic Progress
 *
 * Per-topic stats for each user:
 * Solved, Attempted, Bookmarked, Acceptance, Average Runtime, Completion %
 */

import { prisma } from '../config/database';
import { buildPaginated } from '../utils/response';

export class UserTopicProgressService {
  /**
   * Get progress for all topics for a given user.
   */
  async getAllTopicsProgress(userId: string): Promise<any[]> {
    // Get all active categories
    const categories = await prisma.problemCategory.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true, name: true, slug: true, description: true, displayOrder: true,
        problems: {
          where: { isPublished: true, deletedAt: null },
          select: { id: true, difficulty: true },
        },
      },
    });

    // Get all accepted submissions for this user
    const acceptedSubs = await prisma.submission.findMany({
      where: { userId, status: 'ACCEPTED', isRun: false },
      distinct: ['problemId'],
      select: { problemId: true },
    });
    const solvedSet = new Set(acceptedSubs.map((s) => s.problemId));

    // Get all attempted submissions
    const attemptedSubs = await prisma.submission.findMany({
      where: { userId, isRun: false },
      distinct: ['problemId'],
      select: { problemId: true },
    });
    const attemptedSet = new Set(attemptedSubs.map((s) => s.problemId));

    // Get bookmarked problems
    const bookmarks = await prisma.favoriteProblem.findMany({
      where: { userId },
      select: { problemId: true },
    });
    const bookmarkSet = new Set(bookmarks.map((b) => b.problemId));

    // Average runtime per user
    const runtimeAgg = await prisma.submission.aggregate({
      where: { userId, status: 'ACCEPTED', runtime: { not: null }, isRun: false },
      _avg: { runtime: true },
    });
    const avgRuntime = parseFloat((runtimeAgg._avg.runtime ?? 0).toFixed(2));

    return categories.map((cat) => {
      const problems = cat.problems;
      const totalEasy = problems.filter((p) => p.difficulty === 'EASY').length;
      const totalMedium = problems.filter((p) => p.difficulty === 'MEDIUM').length;
      const totalHard = problems.filter((p) => p.difficulty === 'HARD').length;
      const total = problems.length;

      const solved = problems.filter((p) => solvedSet.has(p.id)).length;
      const solvedEasy = problems.filter((p) => p.difficulty === 'EASY' && solvedSet.has(p.id)).length;
      const solvedMedium = problems.filter((p) => p.difficulty === 'MEDIUM' && solvedSet.has(p.id)).length;
      const solvedHard = problems.filter((p) => p.difficulty === 'HARD' && solvedSet.has(p.id)).length;
      const attempted = problems.filter((p) => attemptedSet.has(p.id)).length;
      const bookmarked = problems.filter((p) => bookmarkSet.has(p.id)).length;
      const completionPct = total > 0 ? parseFloat(((solved / total) * 100).toFixed(1)) : 0;

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        totalProblems: total,
        totalEasy,
        totalMedium,
        totalHard,
        solved,
        solvedEasy,
        solvedMedium,
        solvedHard,
        attempted,
        bookmarked,
        completionPct,
        avgRuntime,
      };
    });
  }

  /**
   * Get progress for a specific topic for a user.
   */
  async getTopicProgress(userId: string, categorySlug: string): Promise<any> {
    const category = await prisma.problemCategory.findUnique({
      where: { slug: categorySlug },
      include: {
        problems: {
          where: { isPublished: true, deletedAt: null },
          select: { id: true, difficulty: true, title: true, slug: true, acceptanceRate: true },
        },
      },
    });

    if (!category) return null;

    const problemIds = category.problems.map((p) => p.id);

    const [acceptedSubs, attemptedSubs, bookmarks] = await Promise.all([
      prisma.submission.findMany({
        where: { userId, status: 'ACCEPTED', isRun: false, problemId: { in: problemIds } },
        distinct: ['problemId'],
        select: { problemId: true },
      }),
      prisma.submission.findMany({
        where: { userId, isRun: false, problemId: { in: problemIds } },
        distinct: ['problemId'],
        select: { problemId: true },
      }),
      prisma.favoriteProblem.findMany({
        where: { userId, problemId: { in: problemIds } },
        select: { problemId: true },
      }),
    ]);

    const solvedSet = new Set(acceptedSubs.map((s) => s.problemId));
    const attemptedSet = new Set(attemptedSubs.map((s) => s.problemId));
    const bookmarkSet = new Set(bookmarks.map((b) => b.problemId));

    const total = category.problems.length;
    const solved = category.problems.filter((p) => solvedSet.has(p.id)).length;
    const attempted = category.problems.filter((p) => attemptedSet.has(p.id)).length;
    const bookmarked = category.problems.filter((p) => bookmarkSet.has(p.id)).length;
    const completionPct = total > 0 ? parseFloat(((solved / total) * 100).toFixed(1)) : 0;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      total,
      solved,
      attempted,
      bookmarked,
      completionPct,
      problems: category.problems.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty.toLowerCase(),
        acceptanceRate: p.acceptanceRate,
        status: solvedSet.has(p.id) ? 'solved' : attemptedSet.has(p.id) ? 'attempted' : 'unsolved',
        isBookmarked: bookmarkSet.has(p.id),
      })),
    };
  }
}

export const userTopicProgressService = new UserTopicProgressService();
