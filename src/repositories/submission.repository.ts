import { Submission, Prisma, ProgrammingLanguage, SubmissionStatus } from '@prisma/client';
import { prisma } from '../config/database';

export interface SubmissionFilters {
  userId?: string;
  problemId?: string;
  language?: ProgrammingLanguage;
  status?: SubmissionStatus;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class SubmissionRepository {
  async create(data: Prisma.SubmissionCreateInput): Promise<Submission> {
    return prisma.submission.create({
      data,
      include: {
        problem: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
    }) as Promise<Submission>;
  }

  async findById(id: string): Promise<Submission | null> {
    return prisma.submission.findUnique({
      where: { id },
      include: {
        problem: { select: { id: true, title: true, slug: true, difficulty: true } },
        user: { select: { id: true, fullName: true, email: true } },
      },
    }) as Promise<Submission | null>;
  }

  async findAll(
    filters: SubmissionFilters,
    pagination: PaginationOptions,
  ): Promise<{ data: Submission[]; total: number }> {
    const where: Prisma.SubmissionWhereInput = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.problemId) where.problemId = filters.problemId;
    if (filters.language) where.language = filters.language;
    if (filters.status) where.status = filters.status;

    const skip = (pagination.page - 1) * pagination.limit;
    const [data, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          problem: { select: { id: true, title: true, slug: true, difficulty: true } },
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      prisma.submission.count({ where }),
    ]);

    return { data: data as Submission[], total };
  }

  async findByProblemId(
    problemId: string,
    pagination: PaginationOptions,
  ): Promise<{ data: Submission[]; total: number }> {
    return this.findAll({ problemId }, pagination);
  }

  // Statistics — derived from submissions table (PRD-03 architectural improvement)
  async getCodingStats(userId: string): Promise<{
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    totalSubmissions: number;
    acceptedSubmissions: number;
    acceptanceRate: number;
    averageRuntime: number;
    favoriteLanguage: string | null;
    currentStreak: number;
    longestStreak: number;
  }> {
    // Distinct accepted problem IDs per difficulty
    const [solved, totalSubs, runtimeAgg, langGroups] = await Promise.all([
      // All accepted problems (distinct)
      prisma.submission.groupBy({
        by: ['problemId'],
        where: { userId, status: 'ACCEPTED' },
        _count: { problemId: true },
      }),
      // Total submissions
      prisma.submission.count({ where: { userId } }),
      // Average runtime (accepted only)
      prisma.submission.aggregate({
        where: { userId, status: 'ACCEPTED', runtime: { not: null } },
        _avg: { runtime: true },
      }),
      // Language frequency
      prisma.submission.groupBy({
        by: ['language'],
        where: { userId },
        _count: { language: true },
        orderBy: { _count: { language: 'desc' } },
      }),
    ]);

    const solvedProblemIds = solved.map((s) => s.problemId);
    const totalSolved = solvedProblemIds.length;

    // Fetch difficulties for solved problems
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    if (solvedProblemIds.length > 0) {
      const problems = await prisma.codingProblem.findMany({
        where: { id: { in: solvedProblemIds } },
        select: { id: true, difficulty: true },
      });
      for (const p of problems) {
        if (p.difficulty === 'EASY') easySolved++;
        else if (p.difficulty === 'MEDIUM') mediumSolved++;
        else if (p.difficulty === 'HARD') hardSolved++;
      }
    }

    const acceptedSubs = await prisma.submission.count({ where: { userId, status: 'ACCEPTED' } });
    const acceptanceRate = totalSubs > 0 ? parseFloat(((acceptedSubs / totalSubs) * 100).toFixed(2)) : 0;
    const averageRuntime = parseFloat((runtimeAgg._avg.runtime ?? 0).toFixed(2));
    const favoriteLanguage = langGroups.length > 0 ? String(langGroups[0]!.language) : null;

    // Streak calculation — get distinct submission dates ordered desc
    const streakData = await prisma.submission.findMany({
      where: { userId, status: 'ACCEPTED' },
      select: { submittedAt: true },
      orderBy: { submittedAt: 'desc' },
    });

    const distinctDates = [
      ...new Set(
        streakData.map((s) => s.submittedAt.toISOString().slice(0, 10)),
      ),
    ].sort((a, b) => (a > b ? -1 : 1));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < distinctDates.length; i++) {
      const date = distinctDates[i]!;
      const prevDate = distinctDates[i - 1];

      if (i === 0) {
        tempStreak = 1;
      } else {
        // Check if consecutive
        const prev = new Date(prevDate!);
        const curr = new Date(date);
        const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }

      if (tempStreak > longestStreak) longestStreak = tempStreak;

      // Current streak: consecutive from today or yesterday
      if (i === 0 && (date === today || date === this.daysAgo(1))) {
        currentStreak = tempStreak;
      } else if (currentStreak > 0) {
        currentStreak = tempStreak;
      }
    }

    return {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      totalSubmissions: totalSubs,
      acceptedSubmissions: acceptedSubs,
      acceptanceRate,
      averageRuntime,
      favoriteLanguage,
      currentStreak,
      longestStreak,
    };
  }

  private daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }
}

export const submissionRepository = new SubmissionRepository();
