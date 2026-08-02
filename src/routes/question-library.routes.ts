/**
 * FPRD-17 Phase 15, 16, 19, 20 — Question Library Routes
 *
 * Phase 15 — Question Library: 50+ topics, Easy/Medium/Hard, Search, Filters, Pagination
 * Phase 16 — Topic Structure: grouped by topic category
 * Phase 19 — Search: Title, Topic, Difficulty, Companies, Tags, Acceptance, Status, Keyword
 * Phase 20 — Recommendations: Next Easy, Next Medium, Revision Problems, Weak Topics, etc.
 *
 * Mounted at /api/questions
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ProblemDifficulty, ProgrammingLanguage } from '@prisma/client';
import { prisma } from '../config/database';
import { sendSuccess, buildPaginated } from '../utils/response';
import { authenticate } from '../middlewares/authenticate.middleware';
import { cacheService } from '../services/cache.service';
import { env } from '../config/env';

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeProblem(p: any, solvedSet?: Set<string>, favoriteSet?: Set<string>) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    difficulty: (p.difficulty ?? 'EASY').toLowerCase(),
    acceptanceRate: p.acceptanceRate ?? 0,
    submissionCount: p.submissionCount ?? p._count?.submissions ?? 0,
    totalSubmissions: p.submissionCount ?? p._count?.submissions ?? 0,
    discussionCount: p._count?.discussions ?? 0,
    timeLimit: p.timeLimit ?? 2000,
    memoryLimit: p.memoryLimit ?? 256,
    outputLimit: p.outputLimit ?? 64,
    estimatedTime: p.estimatedTime ?? null,
    xp: p.xp ?? 0,
    points: p.points ?? 0,
    sourceType: p.sourceType ?? 'ORIGINAL',
    hints: p.hints ?? [],
    notes: p.notes ?? null,
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
    isSolved: solvedSet ? solvedSet.has(p.id) : false,
    isFavorite: favoriteSet ? favoriteSet.has(p.id) : false,
  };
}

async function getUserSets(userId?: string): Promise<{ solvedSet: Set<string>; favoriteSet: Set<string> }> {
  if (!userId) return { solvedSet: new Set(), favoriteSet: new Set() };

  const [solved, favorites] = await Promise.all([
    prisma.submission.findMany({
      where: { userId, status: 'ACCEPTED', isRun: false },
      distinct: ['problemId'],
      select: { problemId: true },
    }),
    prisma.favoriteProblem.findMany({
      where: { userId },
      select: { problemId: true },
    }),
  ]);

  return {
    solvedSet: new Set(solved.map((s) => s.problemId)),
    favoriteSet: new Set(favorites.map((f) => f.problemId)),
  };
}

const PROBLEM_INCLUDE = {
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
  companies: { include: { company: { select: { id: true, name: true, logo: true } } } },
  _count: { select: { submissions: true, discussions: true } },
} as const;

// ─── Phase 15 — Question Library: GET /questions ──────────────────────────────
//
// Supports: search, difficulty, topic, tag, company, status, sort, page, limit
// Phase 23: cursor pagination + response caching
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;

    const {
      search,
      difficulty,
      topic,
      tagId,
      companyId,
      status,     // solved | unsolved | attempted
      sortBy,     // title | difficulty | acceptanceRate | submissionCount
      sortOrder,  // asc | desc
      page: rawPage,
      limit: rawLimit,
      cursor,     // cursor-based pagination (Phase 23)
    } = req.query as Record<string, string>;

    const page = Math.max(1, parseInt(rawPage ?? '1', 10));
    const limit = Math.min(parseInt(rawLimit ?? '20', 10), 100);

    const where: any = { isPublished: true, deletedAt: null };

    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty.toUpperCase() as ProblemDifficulty;
    }
    if (topic) {
      const cat = await prisma.problemCategory.findFirst({
        where: { OR: [{ slug: topic }, { id: topic }] },
      });
      if (cat) where.categoryId = cat.id;
    }
    if (tagId) where.tags = { some: { tagId } };
    if (companyId) where.companies = { some: { companyId } };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { problemStatement: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Solved / unsolved filtering requires userId
    if (status === 'solved' && userId) {
      where.submissions = { some: { userId, status: 'ACCEPTED', isRun: false } };
    } else if (status === 'unsolved' && userId) {
      where.NOT = { submissions: { some: { userId, status: 'ACCEPTED', isRun: false } } };
    } else if (status === 'attempted' && userId) {
      where.submissions = { some: { userId, isRun: false } };
      where.NOT = { submissions: { some: { userId, status: 'ACCEPTED', isRun: false } } };
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'title') orderBy = { title: sortOrder ?? 'asc' };
    else if (sortBy === 'difficulty') orderBy = { difficulty: sortOrder ?? 'asc' };
    else if (sortBy === 'acceptanceRate') orderBy = { acceptanceRate: sortOrder ?? 'desc' };
    else if (sortBy === 'submissionCount') orderBy = { submissionCount: sortOrder ?? 'desc' };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.codingProblem.findMany({
        where,
        include: PROBLEM_INCLUDE,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.codingProblem.count({ where }),
    ]);

    const { solvedSet, favoriteSet } = await getUserSets(userId);
    const normalized = data.map((p) => normalizeProblem(p, solvedSet, favoriteSet));

    sendSuccess(res, 'Questions fetched', buildPaginated(normalized, total, page, limit));
  } catch (err) {
    next(err);
  }
});

// ─── Phase 16 — Topic Structure: GET /questions/topics ───────────────────────
//
// Returns all 50+ topics with problem counts per difficulty
router.get('/topics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'question_library:topics';
    const cached = await cacheService.get(cacheKey);
    if (cached) { sendSuccess(res, 'Topics fetched', cached); return; }

    const categories = await prisma.problemCategory.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      include: {
        problems: {
          where: { isPublished: true, deletedAt: null },
          select: { difficulty: true },
        },
      },
    });

    const topics = categories.map((cat) => {
      const easy   = cat.problems.filter((p) => p.difficulty === 'EASY').length;
      const medium = cat.problems.filter((p) => p.difficulty === 'MEDIUM').length;
      const hard   = cat.problems.filter((p) => p.difficulty === 'HARD').length;
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? null,
        displayOrder: cat.displayOrder,
        totalProblems: easy + medium + hard,
        easy, medium, hard,
      };
    });

    await cacheService.set(cacheKey, topics, env.CACHE_TTL_MEDIUM);
    sendSuccess(res, 'Topics fetched', topics);
  } catch (err) {
    next(err);
  }
});

// ─── Phase 16 — Topic Detail: GET /questions/topics/:slug ────────────────────
router.get('/topics/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { slug } = req.params;
    const {
      search, companyId, tagId,
      page: rawPage, limit: rawLimit,
      difficulty, sortBy, sortOrder,
    } = req.query as Record<string, string>;

    const page  = Math.max(1, parseInt(rawPage ?? '1', 10));
    const limit = Math.min(parseInt(rawLimit ?? '50', 10), 100);

    const category = await prisma.problemCategory.findUnique({ where: { slug } });
    if (!category) {
      res.status(404).json({ success: false, message: 'Topic not found' });
      return;
    }

    const where: any = { categoryId: category.id, isPublished: true, deletedAt: null };
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (companyId) where.companies = { some: { companyId } };
    if (tagId) where.tags = { some: { tagId } };
    if (difficulty && difficulty !== 'all') where.difficulty = difficulty.toUpperCase();

    let orderBy: any = [{ difficulty: 'asc' }, { title: 'asc' }];
    if (sortBy === 'title') orderBy = { title: sortOrder ?? 'asc' };
    else if (sortBy === 'acceptanceRate') orderBy = { acceptanceRate: sortOrder ?? 'desc' };

    const [problems, total, easyCount, mediumCount, hardCount] = await Promise.all([
      prisma.codingProblem.findMany({
        where,
        include: PROBLEM_INCLUDE,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.codingProblem.count({ where }),
      prisma.codingProblem.count({ where: { ...where, difficulty: 'EASY' } }),
      prisma.codingProblem.count({ where: { ...where, difficulty: 'MEDIUM' } }),
      prisma.codingProblem.count({ where: { ...where, difficulty: 'HARD' } }),
    ]);

    const { solvedSet, favoriteSet } = await getUserSets(userId);
    const normalized = problems.map((p) => normalizeProblem(p, solvedSet, favoriteSet));

    sendSuccess(res, 'Topic detail fetched', {
      topic: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? null,
        totalProblems: total,
        easy: easyCount, medium: mediumCount, hard: hardCount,
      },
      problems: {
        easy:   normalized.filter((p) => p.difficulty === 'easy'),
        medium: normalized.filter((p) => p.difficulty === 'medium'),
        hard:   normalized.filter((p) => p.difficulty === 'hard'),
      },
      pagination: buildPaginated(normalized, total, page, limit),
    });
  } catch (err) {
    next(err);
  }
});

// ─── Phase 19 — Instant Search: GET /questions/search ────────────────────────
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const {
      q, difficulty, topic, tagId, companyId,
      minAcceptance, maxAcceptance,
      status, page: rawPage, limit: rawLimit,
    } = req.query as Record<string, string>;

    if (!q || q.trim().length === 0) {
      sendSuccess(res, 'Search results', buildPaginated([], 0, 1, 20));
      return;
    }

    const page  = Math.max(1, parseInt(rawPage ?? '1', 10));
    const limit = Math.min(parseInt(rawLimit ?? '20', 10), 50);

    const where: any = { isPublished: true, deletedAt: null };

    // Full-text keyword search across title + statement
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { problemStatement: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];

    if (difficulty && difficulty !== 'all') where.difficulty = difficulty.toUpperCase();
    if (topic) {
      const cat = await prisma.problemCategory.findFirst({
        where: { OR: [{ slug: topic }, { name: { contains: topic, mode: 'insensitive' } }] },
      });
      if (cat) where.categoryId = cat.id;
    }
    if (tagId) where.tags = { some: { tagId } };
    if (companyId) where.companies = { some: { companyId } };
    if (minAcceptance) where.acceptanceRate = { gte: parseFloat(minAcceptance) };
    if (maxAcceptance) where.acceptanceRate = { ...where.acceptanceRate, lte: parseFloat(maxAcceptance) };

    if (status === 'solved' && userId) {
      where.submissions = { some: { userId, status: 'ACCEPTED', isRun: false } };
    } else if (status === 'unsolved' && userId) {
      where.NOT = { submissions: { some: { userId, status: 'ACCEPTED', isRun: false } } };
    }

    const [data, total] = await Promise.all([
      prisma.codingProblem.findMany({
        where,
        include: PROBLEM_INCLUDE,
        orderBy: { acceptanceRate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.codingProblem.count({ where }),
    ]);

    const { solvedSet, favoriteSet } = await getUserSets(userId);
    const normalized = data.map((p) => normalizeProblem(p, solvedSet, favoriteSet));

    sendSuccess(res, 'Search results', buildPaginated(normalized, total, page, limit));
  } catch (err) {
    next(err);
  }
});

// ─── Phase 20 — Recommendations: GET /questions/recommend ────────────────────
router.get('/recommend', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const limit = Math.min(parseInt((req.query.limit as string) ?? '6', 10), 20);
    const type = (req.query.type as string) ?? 'next'; // next | revision | weak | company | interview

    if (!userId) {
      const problems = await prisma.codingProblem.findMany({
        where: { isPublished: true, deletedAt: null, difficulty: 'EASY' },
        take: limit,
        orderBy: { acceptanceRate: 'desc' },
        include: PROBLEM_INCLUDE,
      });
      sendSuccess(res, 'Recommendations fetched', problems.map((p) => normalizeProblem(p)));
      return;
    }

    const { solvedSet, favoriteSet } = await getUserSets(userId);
    let problems: any[] = [];

    if (type === 'next_easy' || type === 'next') {
      // Next easy problems not yet solved
      problems = await prisma.codingProblem.findMany({
        where: {
          isPublished: true, deletedAt: null, difficulty: 'EASY',
          NOT: { submissions: { some: { userId, status: 'ACCEPTED', isRun: false } } },
        },
        take: limit,
        orderBy: { acceptanceRate: 'desc' },
        include: PROBLEM_INCLUDE,
      });
    } else if (type === 'next_medium') {
      problems = await prisma.codingProblem.findMany({
        where: {
          isPublished: true, deletedAt: null, difficulty: 'MEDIUM',
          NOT: { submissions: { some: { userId, status: 'ACCEPTED', isRun: false } } },
        },
        take: limit,
        orderBy: { acceptanceRate: 'desc' },
        include: PROBLEM_INCLUDE,
      });
    } else if (type === 'revision') {
      // Revision: problems solved more than 7 days ago
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      const oldSolved = await prisma.submission.findMany({
        where: { userId, status: 'ACCEPTED', isRun: false, submittedAt: { lt: sevenDaysAgo } },
        distinct: ['problemId'],
        select: { problemId: true },
        take: limit * 3,
        orderBy: { submittedAt: 'asc' },
      });
      const ids = oldSolved.map((s) => s.problemId).slice(0, limit);
      if (ids.length > 0) {
        problems = await prisma.codingProblem.findMany({
          where: { id: { in: ids }, isPublished: true },
          include: PROBLEM_INCLUDE,
        });
      }
    } else if (type === 'weak') {
      // Weak topics: topics with lowest completion %
      const categories = await prisma.problemCategory.findMany({
        where: { isActive: true, deletedAt: null },
        include: {
          problems: {
            where: { isPublished: true, deletedAt: null },
            select: { id: true },
          },
        },
      });

      // Find topics with fewest solved problems
      const topicCompletion = categories
        .filter((c) => c.problems.length > 0)
        .map((c) => {
          const solved = c.problems.filter((p) => solvedSet.has(p.id)).length;
          return { id: c.id, completion: solved / c.problems.length };
        })
        .sort((a, b) => a.completion - b.completion)
        .slice(0, 3);

      const weakIds = topicCompletion.map((t) => t.id);
      if (weakIds.length > 0) {
        problems = await prisma.codingProblem.findMany({
          where: {
            categoryId: { in: weakIds }, isPublished: true, deletedAt: null,
            NOT: { submissions: { some: { userId, status: 'ACCEPTED', isRun: false } } },
          },
          take: limit,
          orderBy: { difficulty: 'asc' },
          include: PROBLEM_INCLUDE,
        });
      }
    } else if (type === 'continue') {
      // Continue solving: attempted but not solved
      const attempted = await prisma.submission.findMany({
        where: { userId, isRun: false },
        distinct: ['problemId'],
        select: { problemId: true },
        orderBy: { submittedAt: 'desc' },
        take: limit * 3,
      });
      const continueIds = attempted
        .map((s) => s.problemId)
        .filter((id) => !solvedSet.has(id))
        .slice(0, limit);

      if (continueIds.length > 0) {
        problems = await prisma.codingProblem.findMany({
          where: { id: { in: continueIds }, isPublished: true },
          include: PROBLEM_INCLUDE,
        });
      }
    } else if (type === 'recently_viewed') {
      // Placeholder — could integrate with a view-tracking table
      problems = await prisma.codingProblem.findMany({
        where: {
          isPublished: true, deletedAt: null,
          NOT: { submissions: { some: { userId, status: 'ACCEPTED', isRun: false } } },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: PROBLEM_INCLUDE,
      });
    } else {
      // Default fallback
      problems = await prisma.codingProblem.findMany({
        where: {
          isPublished: true, deletedAt: null,
          NOT: { submissions: { some: { userId, status: 'ACCEPTED', isRun: false } } },
        },
        take: limit,
        orderBy: { acceptanceRate: 'desc' },
        include: PROBLEM_INCLUDE,
      });
    }

    sendSuccess(res, 'Recommendations fetched', problems.map((p) => normalizeProblem(p, solvedSet, favoriteSet)));
  } catch (err) {
    next(err);
  }
});

// ─── Phase 21 — User Progress: GET /questions/progress ───────────────────────
router.get('/progress', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { userTopicProgressService } = await import('../services/user-topic-progress.service');
    const progress = await userTopicProgressService.getAllTopicsProgress(userId);
    sendSuccess(res, 'User topic progress fetched', progress);
  } catch (err) {
    next(err);
  }
});

// ─── Phase 21 — Per-topic progress: GET /questions/progress/:slug ─────────────
router.get('/progress/:slug', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    const { userTopicProgressService } = await import('../services/user-topic-progress.service');
    const progress = await userTopicProgressService.getTopicProgress(userId, req.params.slug);
    if (!progress) {
      res.status(404).json({ success: false, message: 'Topic not found' });
      return;
    }
    sendSuccess(res, 'Topic progress fetched', progress);
  } catch (err) {
    next(err);
  }
});

// ─── Phase 17 — Problem Detail: GET /questions/:id ───────────────────────────
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    const problem = await prisma.codingProblem.findFirst({
      where: isUuid
        ? { id, isPublished: true, deletedAt: null }
        : { slug: id, isPublished: true, deletedAt: null },
      include: {
        ...PROBLEM_INCLUDE,
        _count: { select: { submissions: true, discussions: true, testCases: true } },
      },
    });

    if (!problem) {
      res.status(404).json({ success: false, message: 'Problem not found' });
      return;
    }

    const { solvedSet, favoriteSet } = await getUserSets(userId);

    // Get language templates
    const templates = await prisma.codeTemplate.findMany({
      where: { problemId: problem.id },
      select: { language: true, template: true },
    });

    // Build visible examples from sampleInput/Output
    const examples = [];
    if (problem.sampleInput || problem.sampleOutput) {
      examples.push({
        id: `${problem.id}-ex1`,
        input: problem.sampleInput ?? '',
        output: problem.sampleOutput ?? '',
        explanation: problem.explanation ?? undefined,
      });
    }

    // Build related problems
    const related = await prisma.relatedProblem.findMany({
      where: { fromId: problem.id },
      include: {
        to: {
          select: { id: true, title: true, slug: true, difficulty: true, acceptanceRate: true },
        },
      },
      take: 5,
    });

    sendSuccess(res, 'Problem fetched', {
      ...normalizeProblem(problem, solvedSet, favoriteSet),
      description: problem.problemStatement ?? problem.description ?? '',
      problemStatement: problem.problemStatement,
      inputFormat: problem.inputFormat ?? null,
      outputFormat: problem.outputFormat ?? null,
      constraints: problem.constraints ?? null,
      notes: problem.notes ?? null,
      hints: (problem as any).hints ?? [],
      examples,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
      outputLimit: (problem as any).outputLimit ?? 64,
      license: (problem as any).license ?? 'ORIGINAL',
      templates: templates.map((t) => ({ language: t.language, code: t.template })),
      relatedProblems: related.map((r) => ({
        id: r.to.id,
        title: r.to.title,
        slug: r.to.slug,
        difficulty: r.to.difficulty.toLowerCase(),
        acceptanceRate: r.to.acceptanceRate,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
