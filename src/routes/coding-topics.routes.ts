/**
 * FPRD-16 — Coding Question Bank: Topic-based API Routes
 *
 * Provides topic (ProblemCategory) aggregated endpoints that power the
 * Question Bank UI: topic cards with problem counts per difficulty,
 * and per-topic problem listing grouped by difficulty.
 *
 * All routes are mounted under /api/coding/topics
 */

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { sendSuccess } from '../utils/response';

const router = Router();

// ─── GET /topics — list all active topics with problem counts ─────────────────
//
// Returns an array of topic objects each containing:
//   { id, name, slug, description, displayOrder, totalProblems, easy, medium, hard }
//
// Used by the Question Bank home to render topic cards.
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.problemCategory.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { problems: true } },
        problems: {
          where: { isPublished: true, deletedAt: null },
          select: { difficulty: true },
        },
      },
    });

    const topics = categories.map((cat) => {
      const easy = cat.problems.filter((p) => p.difficulty === 'EASY').length;
      const medium = cat.problems.filter((p) => p.difficulty === 'MEDIUM').length;
      const hard = cat.problems.filter((p) => p.difficulty === 'HARD').length;
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? null,
        displayOrder: cat.displayOrder,
        totalProblems: easy + medium + hard,
        easy,
        medium,
        hard,
      };
    });

    sendSuccess(res, 'Topics fetched successfully', topics);
  } catch (err) {
    next(err);
  }
});

// ─── GET /topics/:slug — get topic details + problems grouped by difficulty ───
//
// Returns:
//   { topic: {...}, easy: Problem[], medium: Problem[], hard: Problem[] }
//   Each problem follows the ProblemListItem shape used by the frontend.
//
// Supports query params: search, company, tag, status (solved/unsolved/attempted),
// sort (title_asc, title_desc, acceptance_asc, acceptance_desc), page, limit
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { search, companyId, tagId, page: rawPage, limit: rawLimit } = req.query as Record<string, string>;

    const page = Math.max(1, parseInt(rawPage ?? '1', 10));
    const limit = Math.min(parseInt(rawLimit ?? '50', 10), 100);

    const category = await prisma.problemCategory.findUnique({
      where: { slug },
    });

    if (!category) {
      res.status(404).json({ success: false, message: 'Topic not found' });
      return;
    }

    // Build where clause for problems
    const where: any = {
      categoryId: category.id,
      isPublished: true,
      deletedAt: null,
    };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (companyId) {
      where.companies = { some: { companyId } };
    }
    if (tagId) {
      where.tags = { some: { tagId } };
    }

    const [allProblems, total] = await Promise.all([
      prisma.codingProblem.findMany({
        where,
        orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
          companies: { include: { company: { select: { id: true, name: true, logo: true } } } },
          _count: { select: { submissions: true, discussions: true } },
        },
      }),
      prisma.codingProblem.count({ where }),
    ]);

    const normalize = (p: any) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      difficulty: (p.difficulty ?? 'EASY').toLowerCase(),
      acceptanceRate: p.acceptanceRate ?? 0,
      totalSubmissions: p._count?.submissions ?? 0,
      discussionCount: p._count?.discussions ?? 0,
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
        : { id: category.id, name: category.name, slug: category.slug },
      isSolved: false,
      isFavorite: false,
      points: p.points ?? 0,
      estimatedTime: p.timeLimit ? Math.ceil(p.timeLimit / 1000) * 5 : 30,
      xp: p.points ?? 0,
    });

    const normalized = allProblems.map(normalize);

    // Group by difficulty
    const easy = normalized.filter((p) => p.difficulty === 'easy');
    const medium = normalized.filter((p) => p.difficulty === 'medium');
    const hard = normalized.filter((p) => p.difficulty === 'hard');

    // Counts for the full category (not paginated) 
    const [easyCount, mediumCount, hardCount] = await Promise.all([
      prisma.codingProblem.count({ where: { ...where, difficulty: 'EASY' } }),
      prisma.codingProblem.count({ where: { ...where, difficulty: 'MEDIUM' } }),
      prisma.codingProblem.count({ where: { ...where, difficulty: 'HARD' } }),
    ]);

    sendSuccess(res, 'Topic detail fetched successfully', {
      topic: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? null,
        totalProblems: total,
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount,
      },
      problems: {
        easy,
        medium,
        hard,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
