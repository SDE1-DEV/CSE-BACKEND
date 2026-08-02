/**
 * Coding Routes — /api/coding/*
 *
 * Single source of truth for all endpoints the frontend codingService.ts calls.
 * The backend historically mounted these at /api/problems, /api/submissions, etc.
 * This router re-exports them under /api/coding/* to match frontend expectations.
 *
 * FPRD-14: Added /coding/run, /coding/submit, /coding/analytics,
 *          /coding/recommended, /coding/recently-solved, /coding/continue
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ProgrammingLanguage, SubmissionStatus } from '@prisma/client';

import { getProblems } from '../controllers/coding-problem.controller';
import { codingProblemService } from '../services/coding-problem.service';
import { getTags } from '../controllers/tag.controller';
import { getCompanies } from '../controllers/company.controller';
import { getToday as getDailyChallenge } from '../controllers/daily-challenge.controller';
import {
  createSubmission,
  getSubmissions,
  getSubmissionById,
  getSubmissionsByProblem,
} from '../controllers/submission.controller';
import { addFavorite, removeFavorite, getFavorites } from '../controllers/favorite.controller';
import { getDiscussions, createDiscussion } from '../controllers/discussion.controller';
import { getTestCases } from '../controllers/test-case.controller';
import { getTemplates } from '../controllers/code-template.controller';

import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { getProblemsQuerySchema } from '../validators/coding-problem.validator';
import { createSubmissionSchema, getSubmissionsQuerySchema } from '../validators/submission.validator';
import { createDiscussionSchema, getDiscussionsQuerySchema } from '../validators/discussion.validator';

import { prisma } from '../config/database';
import { sendSuccess, buildPaginated } from '../utils/response';
import { submissionRepository } from '../repositories/submission.repository';
import { codingProblemRepository } from '../repositories/coding-problem.repository';

// FPRD-16: Topics sub-router
import codingTopicsRoutes from './coding-topics.routes';

const router = Router();

// ─── FPRD-16: Topics (Question Bank) ─────────────────────────────────────────
router.use('/topics', codingTopicsRoutes);

// ─── Problems ─────────────────────────────────────────────────────────────────
router.get('/problems', authenticate, validate(getProblemsQuerySchema), getProblems);

// Problem by slug or UUID — used by ProblemDetailPage
router.get('/problems/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const problem = await codingProblemService.getBySlugOrId(req.params.id, userId);
    sendSuccess(res, 'Problem fetched successfully', problem);
  } catch (err) {
    next(err);
  }
});

// ─── Test Cases & Templates ───────────────────────────────────────────────────
router.get('/problems/:id/test-cases', authenticate, getTestCases);
router.get('/problems/:id/templates', getTemplates);

// ─── Problem Submissions (by problem) ─────────────────────────────────────────
router.get('/problems/:id/submissions', authenticate, requireStudent, getSubmissionsByProblem);

// ─── Favorites ────────────────────────────────────────────────────────────────
router.get('/favorites', authenticate, requireStudent, getFavorites);
router.post('/problems/:id/favorite', authenticate, requireStudent, addFavorite);
router.delete('/problems/:id/favorite', authenticate, requireStudent, removeFavorite);

// ─── Discussions ──────────────────────────────────────────────────────────────
router.get('/problems/:id/discussions', validate(getDiscussionsQuerySchema), getDiscussions);
router.post('/problems/:id/discussions', authenticate, requireStudent, validate(createDiscussionSchema), createDiscussion);

// ─── Categories (from problem-categories) ─────────────────────────────────────
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await prisma.problemCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, name: true, slug: true, description: true, displayOrder: true },
    });
    sendSuccess(res, 'Categories fetched successfully', cats);
  } catch (err) {
    next(err);
  }
});

// ─── Tags ─────────────────────────────────────────────────────────────────────
router.get('/tags', getTags);

// ─── Companies ────────────────────────────────────────────────────────────────
router.get('/companies', getCompanies);

// ─── Daily Challenge ──────────────────────────────────────────────────────────
router.get('/daily', getDailyChallenge);

router.get('/daily/previous', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const limit = Math.min(parseInt((req.query.limit as string) ?? '10', 10), 30);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [challenges, total] = await Promise.all([
      prisma.dailyChallenge.findMany({
        where: { challengeDate: { lt: today } },
        orderBy: { challengeDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          problem: {
            select: {
              id: true, title: true, slug: true, difficulty: true,
              acceptanceRate: true, tags: { include: { tag: true } },
            },
          },
        },
      }),
      prisma.dailyChallenge.count({ where: { challengeDate: { lt: today } } }),
    ]);

    // Normalize to the frontend PreviousChallenge shape
    const normalized = challenges.map((c: any) => {
      const prob = c.problem ?? {};
      return {
        id: c.id,
        date: new Date(c.challengeDate).toISOString().split('T')[0],
        rewardXp: c.bonusXP ?? 50,
        isSolved: false,
        problem: {
          id: prob.id ?? '',
          slug: prob.slug ?? '',
          title: prob.title ?? '',
          difficulty: (prob.difficulty ?? 'EASY').toLowerCase(),
          acceptanceRate: prob.acceptanceRate ?? 0,
          totalSubmissions: 0,
          tags: (prob.tags ?? []).map((t: any) => ({
            id: t.tag?.id ?? t.id,
            name: t.tag?.name ?? t.name,
            slug: t.tag?.slug ?? t.slug,
          })),
          companies: [],
          category: { id: '', name: 'Uncategorised', slug: 'uncategorised' },
        },
      };
    });

    sendSuccess(res, 'Previous challenges fetched', buildPaginated(normalized, total, page, limit));
  } catch (err) {
    next(err);
  }
});

// ─── Submissions ──────────────────────────────────────────────────────────────
router.get('/submissions', authenticate, requireStudent, validate(getSubmissionsQuerySchema), getSubmissions);
router.get('/submissions/:id', authenticate, requireStudent, getSubmissionById);

// Submission result polling (mock: return submission with status mapped to result shape)
router.get('/submissions/:id/result', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { problem: { select: { id: true, title: true, slug: true } } },
    });
    if (!sub) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }
    const statusMap: Record<string, string> = {
      PENDING: 'pending', ACCEPTED: 'accepted', WRONG_ANSWER: 'wrong_answer',
      TIME_LIMIT_EXCEEDED: 'time_limit_exceeded', MEMORY_LIMIT_EXCEEDED: 'memory_limit_exceeded',
      RUNTIME_ERROR: 'runtime_error', COMPILE_ERROR: 'compile_error',
    };
    sendSuccess(res, 'Submission result fetched', {
      id: sub.id,
      status: statusMap[sub.status] ?? sub.status.toLowerCase(),
      judgeStatus: (sub as any).judgeStatus?.toLowerCase() ?? 'done',
      runtime: sub.runtime ?? null,
      memoryUsed: sub.memoryUsed ?? null,
      score: sub.score,
      passedTestCases: sub.passedTestCases,
      totalTestCases: sub.totalTestCases,
      errorMessage: (sub as any).errorMessage ?? null,
      compileOutput: (sub as any).compileOutput ?? null,
      problem: (sub as any).problem,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Run Code (executes synchronously via mock executor) ──────────────────────
router.post('/run', authenticate, requireStudent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { problemId, code, customInput } = req.body ?? {};
    // Normalize language: frontend may send lowercase ('python') or uppercase ('PYTHON')
    const rawLang = req.body?.language ?? '';
    const language = (typeof rawLang === 'string' ? rawLang.toUpperCase() : rawLang) as ProgrammingLanguage;

    if (!problemId || !language || !code) {
      res.status(400).json({ success: false, message: 'problemId, language, and code are required' });
      return;
    }

    // Validate language is a known ProgrammingLanguage enum value
    const validLanguages: ProgrammingLanguage[] = ['C', 'CPP', 'JAVA', 'PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'GO', 'RUST', 'CSHARP', 'KOTLIN'];
    if (!validLanguages.includes(language)) {
      res.status(400).json({ success: false, message: `Unsupported language: ${rawLang}. Supported: ${validLanguages.join(', ')}` });
      return;
    }

    // FPRD-17: delegate to the new SubmissionService.run()
    const { submissionService } = await import('../services/submission.service');
    const submission = await submissionService.run(
      userId,
      problemId,
      language,
      code,
      customInput,
    );

    const statusMap: Record<string, string> = {
      PENDING: 'pending', ACCEPTED: 'accepted', WRONG_ANSWER: 'wrong_answer',
      TIME_LIMIT_EXCEEDED: 'time_limit_exceeded', MEMORY_LIMIT_EXCEEDED: 'memory_limit_exceeded',
      RUNTIME_ERROR: 'runtime_error', COMPILE_ERROR: 'compile_error',
    };

    const detail = await prisma.submission.findUnique({
      where: { id: submission.id },
      include: { testResults: { select: { testCaseId: true, passed: true, actualOutput: true, expectedOutput: true, runtime: true } } },
    });

    sendSuccess(res, 'Code executed', {
      submissionId: submission.id,
      status: statusMap[(detail?.status ?? 'PENDING')] ?? 'pending',
      runtime: detail?.runtime ?? null,
      memoryUsed: detail?.memoryUsed ?? null,
      errorMessage: (detail as any)?.errorMessage ?? null,
      testResults: (detail?.testResults ?? []),
    });
  } catch (err) {
    next(err);
  }
});

// ─── Submit Code ──────────────────────────────────────────────────────────────
router.post('/submit', authenticate, requireStudent, validate(createSubmissionSchema), createSubmission);

// ─── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics', authenticate, requireStudent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    // FPRD-17: delegate to the full analytics in submissionService
    const { submissionService } = await import('../services/submission.service');
    const stats = await submissionService.getCodingStats(userId);
    sendSuccess(res, 'Analytics fetched', {
      stats,
      weeklyActivity: [],
      submissionTrend: [],
      difficultyDistribution: [],
      languageUsage: (stats as any).languageUsage ?? [],
    });
  } catch (err) {
    next(err);
  }
});

/** Normalize a raw Prisma CodingProblem record to the shape the frontend expects */
function normalizeProblem(p: any) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    difficulty: (p.difficulty ?? 'EASY').toLowerCase(),
    acceptanceRate: p.acceptanceRate ?? 0,
    totalSubmissions: p._count?.submissions ?? 0,
    tags: (p.tags ?? []).map((t: any) => ({
      id: t.tag?.id ?? t.id,
      name: t.tag?.name ?? t.name,
      slug: t.tag?.slug ?? t.slug,
    })),
    companies: (p.companies ?? []).map((c: any) => ({
      id: c.company?.id ?? c.id,
      name: c.company?.name ?? c.name,
      logo: c.company?.logo ?? null,
    })),
    category: p.category
      ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
      : { id: '', name: 'Uncategorised', slug: 'uncategorised' },
  };
}

// ─── Recommended Problems (published, not solved by user) ─────────────────────
router.get('/recommended', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const limit = Math.min(parseInt((req.query.limit as string) ?? '6', 10) || 6, 20);

    const where: any = { isPublished: true };
    if (userId) {
      where.submissions = { none: { userId, status: 'ACCEPTED' } };
    }

    const problems = await prisma.codingProblem.findMany({
      where,
      take: limit,
      orderBy: { acceptanceRate: 'desc' },
      include: {
        category: true,
        tags: { include: { tag: true } },
        companies: { include: { company: true } },
        _count: { select: { submissions: true } },
      },
    });
    sendSuccess(res, 'Recommended problems fetched', problems.map(normalizeProblem));
  } catch (err) {
    next(err);
  }
});

// ─── Recently Solved ──────────────────────────────────────────────────────────
router.get('/recently-solved', authenticate, requireStudent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const limit = Math.min(parseInt((req.query.limit as string) ?? '5', 10) || 5, 20);

    const recentSubs = await prisma.submission.findMany({
      where: { userId, status: 'ACCEPTED' },
      orderBy: { submittedAt: 'desc' },
      take: limit * 3, // get more then dedupe
      select: { problemId: true },
    });

    const seenIds = new Set<string>();
    const uniqueProblemIds: string[] = [];
    for (const s of recentSubs) {
      if (!seenIds.has(s.problemId)) {
        seenIds.add(s.problemId);
        uniqueProblemIds.push(s.problemId);
        if (uniqueProblemIds.length >= limit) break;
      }
    }

    const problems = uniqueProblemIds.length > 0
      ? await prisma.codingProblem.findMany({
          where: { id: { in: uniqueProblemIds } },
          include: {
            category: true,
            tags: { include: { tag: true } },
            companies: { include: { company: true } },
            _count: { select: { submissions: true } },
          },
        })
      : [];

    sendSuccess(res, 'Recently solved fetched', problems.map(normalizeProblem));
  } catch (err) {
    next(err);
  }
});

// ─── Continue Solving (problems with partial attempts but not accepted) ────────
router.get('/continue', authenticate, requireStudent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const limit = Math.min(parseInt((req.query.limit as string) ?? '3', 10) || 3, 10);

    const attempted = await prisma.submission.findMany({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
      distinct: ['problemId'],
      take: limit * 5,
      select: { problemId: true },
    });

    const attemptedIds = attempted.map((s) => s.problemId);

    const solvedIds = (
      await prisma.submission.findMany({
        where: { userId, status: 'ACCEPTED', problemId: { in: attemptedIds } },
        distinct: ['problemId'],
        select: { problemId: true },
      })
    ).map((s) => s.problemId);

    const solvedSet = new Set(solvedIds);
    const continueIds = attemptedIds.filter((id) => !solvedSet.has(id)).slice(0, limit);

    const problems = continueIds.length > 0
      ? await prisma.codingProblem.findMany({
          where: { id: { in: continueIds }, isPublished: true },
          include: {
            category: true,
            tags: { include: { tag: true } },
            companies: { include: { company: true } },
            _count: { select: { submissions: true } },
          },
        })
      : [];

    sendSuccess(res, 'Continue solving fetched', problems.map(normalizeProblem));
  } catch (err) {
    next(err);
  }
});

export default router;
