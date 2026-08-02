/**
 * FPRD-17 Phase 22 — Admin/Manager Problem Management
 *
 * Full lifecycle management for coding problems and datasets.
 * Mounted at /api/manager/judge
 *
 * Endpoints:
 *   GET    /manager/judge/problems              — list all problems (published + unpublished)
 *   GET    /manager/judge/problems/:id          — problem detail
 *   POST   /manager/judge/problems              — create problem
 *   PUT    /manager/judge/problems/:id          — edit problem
 *   PATCH  /manager/judge/problems/:id/publish  — publish/unpublish
 *   PATCH  /manager/judge/problems/:id/archive  — soft-delete (archive)
 *   POST   /manager/judge/problems/:id/preview  — preview problem
 *   POST   /manager/judge/problems/:id/duplicate — duplicate problem
 *   GET    /manager/judge/problems/:id/test-cases — list test cases
 *   POST   /manager/judge/problems/:id/test-cases — add test case
 *   PUT    /manager/judge/test-cases/:id        — update test case
 *   DELETE /manager/judge/test-cases/:id        — delete test case
 *   GET    /manager/judge/problems/:id/templates — list templates
 *   PUT    /manager/judge/problems/:id/templates/:lang — upsert template
 *   DELETE /manager/judge/templates/:id         — delete template
 *   GET    /manager/judge/problems/:id/submissions — all submissions for problem
 *   POST   /manager/judge/problems/:id/related  — add related problem
 *   DELETE /manager/judge/problems/:id/related/:relatedId — remove related
 *   GET    /manager/judge/stats                 — platform judge stats
 *   GET    /manager/judge/imports               — dataset import history
 *   GET    /manager/judge/community             — community submissions to review
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ProblemDifficulty, ProgrammingLanguage, SourceType } from '@prisma/client';
import { z } from 'zod';

import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
import { validate, validateAndSanitize } from '../middlewares/validate.middleware';
import { sendSuccess, sendCreated, buildPaginated } from '../utils/response';
import { prisma } from '../config/database';
import { cacheService } from '../services/cache.service';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, CODING_MESSAGES } from '../constants';
import { LANGUAGE_CONFIGS } from '../services/execution';

const router = Router();
router.use(authenticate, requireManager);

// ─── Validators ───────────────────────────────────────────────────────────────

const createProblemSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid(),
    title: z.string().min(3).max(200),
    slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().optional(),
    problemStatement: z.string().min(10),
    inputFormat: z.string().optional(),
    outputFormat: z.string().optional(),
    constraints: z.string().optional(),
    notes: z.string().optional(),
    sampleInput: z.string().optional(),
    sampleOutput: z.string().optional(),
    explanation: z.string().optional(),
    difficulty: z.nativeEnum(ProblemDifficulty).default('EASY'),
    timeLimit: z.number().min(500).max(30000).default(2000),
    memoryLimit: z.number().min(32).max(1024).default(256),
    outputLimit: z.number().min(1).max(256).default(64),
    hints: z.array(z.string()).optional(),
    xp: z.number().min(0).default(10),
    estimatedTime: z.number().min(1).optional(),
    license: z.string().optional(),
    sourceType: z.nativeEnum(SourceType).default('ORIGINAL'),
    isPublished: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
    companies: z.array(z.string()).optional(),
  }),
});

const updateProblemSchema = createProblemSchema.shape.body.partial().extend({
  body: z.object({}).passthrough(),
}).shape.body;

const testCaseSchema = z.object({
  body: z.object({
    input: z.string(),
    expectedOutput: z.string(),
    isSample: z.boolean().default(false),
    isHidden: z.boolean().default(false),
    isJudgeOnly: z.boolean().default(false),
    weight: z.number().min(1).default(1),
    displayOrder: z.number().min(0).default(0),
  }),
});

const templateSchema = z.object({
  body: z.object({
    template: z.string().max(50000),
  }),
});

// ─── GET /problems ────────────────────────────────────────────────────────────
router.get('/problems', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page  = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);
    const { search, difficulty, categoryId, isPublished, sourceType } = req.query as Record<string, string>;

    const where: any = { deletedAt: null };
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (difficulty) where.difficulty = difficulty.toUpperCase();
    if (categoryId) where.categoryId = categoryId;
    if (isPublished !== undefined) where.isPublished = isPublished === 'true';
    if (sourceType) where.sourceType = sourceType.toUpperCase();

    const [data, total] = await Promise.all([
      prisma.codingProblem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { submissions: true, testCases: true } },
          tags: { include: { tag: { select: { id: true, name: true } } } },
        },
      }),
      prisma.codingProblem.count({ where }),
    ]);

    sendSuccess(res, 'Problems fetched', buildPaginated(data, total, page, limit));
  } catch (err) { next(err); }
});

// ─── GET /problems/:id ────────────────────────────────────────────────────────
router.get('/problems/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problem = await prisma.codingProblem.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }], deletedAt: null },
      include: {
        category: true,
        tags: { include: { tag: true } },
        companies: { include: { company: true } },
        templates: true,
        testCases: { orderBy: [{ isHidden: 'asc' }, { displayOrder: 'asc' }] },
        _count: { select: { submissions: true, discussions: true } },
      },
    });
    if (!problem) { res.status(404).json({ success: false, message: CODING_MESSAGES.PROBLEM_NOT_FOUND }); return; }
    sendSuccess(res, 'Problem fetched', problem);
  } catch (err) { next(err); }
});

// ─── POST /problems ───────────────────────────────────────────────────────────
router.post('/problems', validate(createProblemSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { tags, companies, ...data } = req.body;

    // Auto-generate slug if not provided
    const slug = data.slug ?? data.title
      .toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-').slice(0, 80);

    const exists = await prisma.codingProblem.findUnique({ where: { slug } });
    if (exists) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.PROBLEM_SLUG_EXISTS);

    const problem = await prisma.codingProblem.create({
      data: {
        ...data,
        slug,
        hints: data.hints ?? undefined,
      },
    });

    // Link tags and companies
    if (tags?.length) {
      for (const tagId of tags) {
        await prisma.problemTagRelation.upsert({
          where: { problemId_tagId: { problemId: problem.id, tagId } },
          create: { problemId: problem.id, tagId },
          update: {},
        });
      }
    }
    if (companies?.length) {
      for (const companyId of companies) {
        await prisma.problemCompany.upsert({
          where: { problemId_companyId: { problemId: problem.id, companyId } },
          create: { problemId: problem.id, companyId },
          update: {},
        });
      }
    }

    // Generate default language templates for all languages
    for (const [lang, config] of Object.entries(LANGUAGE_CONFIGS)) {
      await prisma.codeTemplate.upsert({
        where: { problemId_language: { problemId: problem.id, language: lang as ProgrammingLanguage } },
        create: { problemId: problem.id, language: lang as ProgrammingLanguage, template: config.starterTemplate },
        update: {},
      });
    }

    await cacheService.del('question_library:topics');
    sendCreated(res, CODING_MESSAGES.PROBLEM_CREATED, problem);
  } catch (err) { next(err); }
});

// ─── PUT /problems/:id ────────────────────────────────────────────────────────
router.put('/problems/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problem = await prisma.codingProblem.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    const { tags, companies, ...data } = req.body;

    if (data.slug && data.slug !== problem.slug) {
      const exists = await prisma.codingProblem.findFirst({
        where: { slug: data.slug, id: { not: problem.id } },
      });
      if (exists) throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.PROBLEM_SLUG_EXISTS);
    }

    const updated = await prisma.codingProblem.update({
      where: { id: problem.id },
      data: {
        ...data,
        hints: data.hints !== undefined ? (data.hints as any) : undefined,
        updatedAt: new Date(),
      },
    });

    // Sync tags
    if (tags !== undefined) {
      await prisma.problemTagRelation.deleteMany({ where: { problemId: problem.id } });
      for (const tagId of tags) {
        await prisma.problemTagRelation.create({ data: { problemId: problem.id, tagId } });
      }
    }
    // Sync companies
    if (companies !== undefined) {
      await prisma.problemCompany.deleteMany({ where: { problemId: problem.id } });
      for (const companyId of companies) {
        await prisma.problemCompany.create({ data: { problemId: problem.id, companyId } });
      }
    }

    await cacheService.del('question_library:topics');
    sendSuccess(res, CODING_MESSAGES.PROBLEM_UPDATED, updated);
  } catch (err) { next(err); }
});

// ─── PATCH /problems/:id/publish ─────────────────────────────────────────────
router.patch('/problems/:id/publish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problem = await prisma.codingProblem.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    const isPublished = req.body.isPublished !== undefined ? req.body.isPublished : !problem.isPublished;
    const updated = await prisma.codingProblem.update({
      where: { id: problem.id },
      data: { isPublished },
    });

    await cacheService.del('question_library:topics');
    sendSuccess(res, isPublished ? 'Problem published' : 'Problem unpublished', updated);
  } catch (err) { next(err); }
});

// ─── PATCH /problems/:id/archive ─────────────────────────────────────────────
router.patch('/problems/:id/archive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problem = await prisma.codingProblem.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    await prisma.codingProblem.update({
      where: { id: problem.id },
      data: { isPublished: false, deletedAt: new Date() },
    });

    await cacheService.del('question_library:topics');
    sendSuccess(res, 'Problem archived', null);
  } catch (err) { next(err); }
});

// ─── POST /problems/:id/duplicate ────────────────────────────────────────────
router.post('/problems/:id/duplicate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const original = await prisma.codingProblem.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: { testCases: true, templates: true, tags: true, companies: true },
    });
    if (!original) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    const baseSlug = `${original.slug}-copy`;
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.codingProblem.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const { id, createdAt, updatedAt, deletedAt, slug: _slug, submissionCount, acceptedCount, acceptanceRate, ...rest } = original as any;

    const copy = await prisma.codingProblem.create({
      data: { ...rest, slug, title: `${original.title} (Copy)`, isPublished: false, submissionCount: 0, acceptedCount: 0, acceptanceRate: 0 },
    });

    // Copy test cases, templates, tags, companies
    if (original.testCases.length > 0) {
      await prisma.testCase.createMany({
        data: original.testCases.map(({ id: _id, problemId: _pid, ...tc }: any) => ({ ...tc, problemId: copy.id })),
      });
    }
    if (original.templates.length > 0) {
      await prisma.codeTemplate.createMany({
        data: original.templates.map(({ id: _id, problemId: _pid, ...t }: any) => ({ ...t, problemId: copy.id })),
      });
    }
    for (const { tagId } of original.tags) {
      await prisma.problemTagRelation.create({ data: { problemId: copy.id, tagId } });
    }
    for (const { companyId } of original.companies) {
      await prisma.problemCompany.create({ data: { problemId: copy.id, companyId } });
    }

    sendCreated(res, 'Problem duplicated', copy);
  } catch (err) { next(err); }
});

// ─── GET /problems/:id/test-cases ─────────────────────────────────────────────
router.get('/problems/:id/test-cases', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testCases = await prisma.testCase.findMany({
      where: { problemId: req.params.id },
      orderBy: [{ isHidden: 'asc' }, { displayOrder: 'asc' }],
    });
    sendSuccess(res, 'Test cases fetched', testCases);
  } catch (err) { next(err); }
});

// ─── POST /problems/:id/test-cases ───────────────────────────────────────────
router.post('/problems/:id/test-cases', validate(testCaseSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const problem = await prisma.codingProblem.findFirst({ where: { id: req.params.id, deletedAt: null } });
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);

    const tc = await prisma.testCase.create({
      data: { ...req.body, problemId: req.params.id },
    });
    sendCreated(res, CODING_MESSAGES.TEST_CASE_CREATED, tc);
  } catch (err) { next(err); }
});

// ─── PUT /test-cases/:id ──────────────────────────────────────────────────────
router.put('/test-cases/:id', validate(testCaseSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tc = await prisma.testCase.findUnique({ where: { id: req.params.id } });
    if (!tc) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.TEST_CASE_NOT_FOUND);

    const updated = await prisma.testCase.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendSuccess(res, CODING_MESSAGES.TEST_CASE_UPDATED, updated);
  } catch (err) { next(err); }
});

// ─── DELETE /test-cases/:id ───────────────────────────────────────────────────
router.delete('/test-cases/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.testCase.delete({ where: { id: req.params.id } });
    sendSuccess(res, CODING_MESSAGES.TEST_CASE_DELETED, null);
  } catch (err) { next(err); }
});

// ─── GET /problems/:id/templates ─────────────────────────────────────────────
router.get('/problems/:id/templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await prisma.codeTemplate.findMany({
      where: { problemId: req.params.id },
      orderBy: { language: 'asc' },
    });
    sendSuccess(res, CODING_MESSAGES.TEMPLATES_FETCHED, templates);
  } catch (err) { next(err); }
});

// ─── PUT /problems/:id/templates/:lang ───────────────────────────────────────
router.put('/problems/:id/templates/:lang', validate(templateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lang = req.params.lang.toUpperCase() as ProgrammingLanguage;
    const template = await prisma.codeTemplate.upsert({
      where: { problemId_language: { problemId: req.params.id, language: lang } },
      create: { problemId: req.params.id, language: lang, template: req.body.template },
      update: { template: req.body.template },
    });
    sendSuccess(res, 'Template saved', template);
  } catch (err) { next(err); }
});

// ─── DELETE /templates/:id ────────────────────────────────────────────────────
router.delete('/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.codeTemplate.delete({ where: { id: req.params.id } });
    sendSuccess(res, CODING_MESSAGES.TEMPLATE_DELETED, null);
  } catch (err) { next(err); }
});

// ─── GET /problems/:id/submissions ────────────────────────────────────────────
router.get('/problems/:id/submissions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page  = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);

    const [data, total] = await Promise.all([
      prisma.submission.findMany({
        where: { problemId: req.params.id, isRun: false },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      }),
      prisma.submission.count({ where: { problemId: req.params.id, isRun: false } }),
    ]);

    sendSuccess(res, 'Submissions fetched', buildPaginated(data, total, page, limit));
  } catch (err) { next(err); }
});

// ─── POST /problems/:id/related ───────────────────────────────────────────────
router.post('/problems/:id/related', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { relatedId } = req.body;
    await prisma.relatedProblem.upsert({
      where: { fromId_toId: { fromId: req.params.id, toId: relatedId } },
      create: { fromId: req.params.id, toId: relatedId },
      update: {},
    });
    sendCreated(res, 'Related problem added', null);
  } catch (err) { next(err); }
});

// ─── DELETE /problems/:id/related/:relatedId ─────────────────────────────────
router.delete('/problems/:id/related/:relatedId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.relatedProblem.deleteMany({
      where: { fromId: req.params.id, toId: req.params.relatedId },
    });
    sendSuccess(res, 'Related problem removed', null);
  } catch (err) { next(err); }
});

// ─── GET /stats — Platform judge stats ───────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalProblems, published, totalSubmissions, accepted,
      totalImports, languageBreakdown,
    ] = await Promise.all([
      prisma.codingProblem.count({ where: { deletedAt: null } }),
      prisma.codingProblem.count({ where: { isPublished: true, deletedAt: null } }),
      prisma.submission.count({ where: { isRun: false } }),
      prisma.submission.count({ where: { status: 'ACCEPTED', isRun: false } }),
      prisma.datasetImport.count(),
      prisma.submission.groupBy({
        by: ['language'],
        where: { isRun: false },
        _count: { language: true },
        orderBy: { _count: { language: 'desc' } },
        take: 10,
      }),
    ]);

    sendSuccess(res, 'Judge stats fetched', {
      totalProblems,
      published,
      unpublished: totalProblems - published,
      totalSubmissions,
      accepted,
      acceptanceRate: totalSubmissions > 0 ? parseFloat(((accepted / totalSubmissions) * 100).toFixed(2)) : 0,
      totalImports,
      languageBreakdown: languageBreakdown.map((l) => ({
        language: l.language,
        count: (l._count as any).language,
      })),
    });
  } catch (err) { next(err); }
});

// ─── GET /imports — Dataset import history ────────────────────────────────────
router.get('/imports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page  = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);

    const { datasetImportService } = await import('../services/dataset-import.service');
    const result = await datasetImportService.getImports(undefined, page, limit);
    sendSuccess(res, 'Import history fetched', result);
  } catch (err) { next(err); }
});

// ─── GET /community — Community submissions awaiting review ──────────────────
router.get('/community', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page  = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);

    // Community = problems from COMMUNITY source type that are unpublished
    const [data, total] = await Promise.all([
      prisma.codingProblem.findMany({
        where: { sourceType: 'COMMUNITY', isPublished: false, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { testCases: true } },
        },
      }),
      prisma.codingProblem.count({ where: { sourceType: 'COMMUNITY', isPublished: false, deletedAt: null } }),
    ]);

    sendSuccess(res, 'Community submissions fetched', buildPaginated(data, total, page, limit));
  } catch (err) { next(err); }
});

// ─── Manage topics ────────────────────────────────────────────────────────────
router.get('/topics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const topics = await prisma.problemCategory.findMany({
      where: { deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { problems: true } } },
    });
    sendSuccess(res, 'Topics fetched', topics);
  } catch (err) { next(err); }
});

router.post('/topics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug, description, displayOrder } = req.body;
    const topic = await prisma.problemCategory.create({
      data: { name, slug, description, displayOrder: displayOrder ?? 0 },
    });
    await cacheService.del('question_library:topics');
    sendCreated(res, 'Topic created', topic);
  } catch (err) { next(err); }
});

router.put('/topics/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topic = await prisma.problemCategory.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await cacheService.del('question_library:topics');
    sendSuccess(res, 'Topic updated', topic);
  } catch (err) { next(err); }
});

router.delete('/topics/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.problemCategory.update({
      where: { id: req.params.id },
      data: { isActive: false, deletedAt: new Date() },
    });
    await cacheService.del('question_library:topics');
    sendSuccess(res, 'Topic archived', null);
  } catch (err) { next(err); }
});

export default router;
