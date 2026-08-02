/**
 * FPRD-17 — Online Judge Routes
 *
 * Phase 14 — Backend APIs:
 *   POST /judge/run            — Run code (sample tests or custom input)
 *   POST /judge/submit         — Full submission (all test cases, verdict)
 *   POST /judge/custom-test    — Custom input execution
 *   GET  /judge/submissions/:id/result  — Poll submission result
 *   GET  /judge/submissions/:id/detail  — Full detail with test results
 *   GET  /judge/problems/:id/submissions — Submission history for a problem
 *   GET  /judge/submissions    — All submissions for user
 *   GET  /judge/analytics      — Coding analytics
 *   GET  /judge/templates/:language — Starter template for a language
 *   GET  /judge/languages      — Supported languages with config
 *
 * Phase 11 — Autosave:
 *   PUT  /judge/draft          — Save code draft
 *   GET  /judge/draft/:problemId/:language — Get draft
 *   GET  /judge/draft/:problemId — All drafts for problem
 *   DELETE /judge/draft/:problemId/:language — Delete draft
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ProgrammingLanguage, SubmissionStatus } from '@prisma/client';
import { z } from 'zod';

import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { sendSuccess, sendCreated, buildPaginated } from '../utils/response';
import { submissionService } from '../services/submission.service';
import { codeDraftService } from '../services/code-draft.service';
import { LANGUAGE_CONFIGS } from '../services/execution';
import { prisma } from '../config/database';
import { HTTP_STATUS } from '../constants';

const router = Router();

// All judge routes require authentication
router.use(authenticate, requireStudent);

// ─── Validators ───────────────────────────────────────────────────────────────

/**
 * Normalize language: accept both 'python' (frontend lowercase) and 'PYTHON' (enum).
 */
const judgeLanguageSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.toUpperCase() : val),
  z.nativeEnum(ProgrammingLanguage),
);

const runSchema = z.object({
  body: z.object({
    problemId: z.string().uuid('Invalid problem ID'),
    language: judgeLanguageSchema,
    code: z.string().min(1).max(100_000),
    customInput: z.string().max(10_000).optional(),
  }),
});

const submitSchema = z.object({
  body: z.object({
    problemId: z.string().uuid('Invalid problem ID'),
    language: judgeLanguageSchema,
    sourceCode: z.string().min(1).max(100_000),
  }),
});

const customTestSchema = z.object({
  body: z.object({
    problemId: z.string().uuid('Invalid problem ID'),
    language: judgeLanguageSchema,
    code: z.string().min(1).max(100_000),
    input: z.string().max(10_000),
  }),
});

const draftSchema = z.object({
  body: z.object({
    problemId: z.string().uuid('Invalid problem ID'),
    language: judgeLanguageSchema,
    code: z.string().max(100_000),
  }),
});

// ─── Phase 4 — Run Code ───────────────────────────────────────────────────────
router.post('/run', validate(runSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { problemId, language, code, customInput } = req.body;

    const submission = await submissionService.run(userId, problemId, language as ProgrammingLanguage, code, customInput);

    const statusMap: Record<string, string> = {
      PENDING: 'pending', ACCEPTED: 'accepted', WRONG_ANSWER: 'wrong_answer',
      TIME_LIMIT_EXCEEDED: 'time_limit_exceeded', MEMORY_LIMIT_EXCEEDED: 'memory_limit_exceeded',
      RUNTIME_ERROR: 'runtime_error', COMPILE_ERROR: 'compile_error',
    };

    const detail = await prisma.submission.findUnique({
      where: { id: submission.id },
      include: { testResults: true },
    });

    sendSuccess(res, 'Code executed', {
      submissionId: submission.id,
      status: statusMap[(detail?.status ?? 'PENDING')] ?? 'pending',
      runtime: detail?.runtime ?? null,
      memoryUsed: detail?.memoryUsed ?? null,
      errorMessage: detail?.errorMessage ?? null,
      compileOutput: detail?.compileOutput ?? null,
      testResults: (detail?.testResults ?? []).map((r) => ({
        testCaseId: r.testCaseId,
        passed: r.passed,
        actualOutput: r.actualOutput,
        expectedOutput: r.expectedOutput,
        runtime: r.runtime,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─── Phase 5 — Submit Solution ────────────────────────────────────────────────
router.post('/submit', validate(submitSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { problemId, language, sourceCode } = req.body;

    const submission = await submissionService.submit(userId, { problemId, language, sourceCode });

    sendCreated(res, 'Solution submitted', {
      submissionId: submission.id,
      status: submission.status.toLowerCase(),
      judgeStatus: (submission as any).judgeStatus?.toLowerCase() ?? 'queued',
    });
  } catch (err) {
    next(err);
  }
});

// ─── Phase 4 — Custom Test ────────────────────────────────────────────────────
router.post('/custom-test', validate(customTestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { problemId, language, code, input } = req.body;

    const result = await submissionService.customTest(userId, problemId, language as ProgrammingLanguage, code, input);
    sendSuccess(res, 'Custom test executed', result);
  } catch (err) {
    next(err);
  }
});

// ─── Phase 7 — Submission Result (polling) ────────────────────────────────────
router.get('/submissions/:id/result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const sub = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { problem: { select: { id: true, title: true, slug: true } } },
    });

    if (!sub || sub.userId !== userId) {
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

// ─── Phase 7 — Submission Detail (with per-test results) ──────────────────────
router.get('/submissions/:id/detail', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const isAdmin = ['MANAGER', 'SUPER_ADMIN'].includes((req as any).user?.role);

    const submission = await submissionService.getById(req.params.id, userId, isAdmin);
    sendSuccess(res, 'Submission detail fetched', submission);
  } catch (err) {
    next(err);
  }
});

// ─── Phase 9 — Output Comparison (wrong answer diff) ─────────────────────────
router.get('/submissions/:id/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;

    const sub = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: {
        testResults: {
          take: 10, // show first 10 test case comparisons
          select: {
            testCaseId: true,
            passed: true,
            actualOutput: true,
            expectedOutput: true,
            runtime: true,
            errorMessage: true,
            testCase: { select: { input: true, isSample: true, isHidden: true } },
          },
        },
      },
    });

    if (!sub || sub.userId !== userId) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    // Phase 9: highlight mismatches
    const comparisons = (sub.testResults ?? []).map((r) => {
      const actual = (r.actualOutput ?? '').split('\n');
      const expected = r.expectedOutput.split('\n');
      const diffs = expected.map((line, i) => ({
        line: i + 1,
        expected: line,
        actual: actual[i] ?? '',
        match: line === actual[i],
      }));

      return {
        testCaseId: r.testCaseId,
        passed: r.passed,
        input: (r as any).testCase?.isSample ? (r as any).testCase.input : '[hidden]',
        expectedOutput: r.expectedOutput,
        actualOutput: r.actualOutput ?? '',
        runtime: r.runtime,
        errorMessage: r.errorMessage,
        diff: diffs.filter((d) => !d.match).slice(0, 5), // first 5 mismatches
        isSample: (r as any).testCase?.isSample ?? false,
      };
    });

    sendSuccess(res, 'Output comparison fetched', {
      submissionId: sub.id,
      status: sub.status.toLowerCase(),
      comparisons,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Phase 8 — Submission History by problem ──────────────────────────────────
router.get('/problems/:id/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const history = await submissionService.getHistoryByProblem(req.params.id, userId);
    sendSuccess(res, 'Submission history fetched', history);
  } catch (err) {
    next(err);
  }
});

// ─── Phase 8 — All Submissions ────────────────────────────────────────────────
router.get('/submissions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const isAdmin = ['MANAGER', 'SUPER_ADMIN'].includes((req as any).user?.role);
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);
    const language = req.query.language as ProgrammingLanguage | undefined;
    const status = req.query.status as string | undefined;
    const problemId = req.query.problemId as string | undefined;

    const result = await submissionService.getAll(
      { page, limit, language, status, problemId } as any,
      userId,
      isAdmin,
    );
    sendSuccess(res, 'Submissions fetched', result);
  } catch (err) {
    next(err);
  }
});

// ─── Phase 13 — Analytics ─────────────────────────────────────────────────────
router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const stats = await submissionService.getCodingStats(userId);
    sendSuccess(res, 'Analytics fetched', stats);
  } catch (err) {
    next(err);
  }
});

// ─── Phase 14 — Language Templates ───────────────────────────────────────────
router.get('/languages', (_req: Request, res: Response) => {
  const languages = Object.entries(LANGUAGE_CONFIGS).map(([lang, config]) => ({
    language: lang,
    runtime: config.runtime,
    fileExtension: config.fileExtension,
    defaultTimeLimit: config.defaultTimeLimit,
    defaultMemoryLimit: config.defaultMemoryLimit,
    starterTemplate: config.starterTemplate,
  }));
  sendSuccess(res, 'Languages fetched', languages);
});

router.get('/templates/:language', (req: Request, res: Response, next: NextFunction) => {
  try {
    const lang = req.params.language.toUpperCase() as ProgrammingLanguage;
    const config = LANGUAGE_CONFIGS[lang];
    if (!config) {
      res.status(404).json({ success: false, message: 'Language not supported' });
      return;
    }
    sendSuccess(res, 'Template fetched', {
      language: lang,
      template: config.starterTemplate,
      defaultTimeLimit: config.defaultTimeLimit,
      defaultMemoryLimit: config.defaultMemoryLimit,
    });
  } catch (err) {
    next(err);
  }
});

// ─── Phase 11 — Autosave ──────────────────────────────────────────────────────
router.put('/draft', validate(draftSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { problemId, language, code } = req.body;
    const result = await codeDraftService.saveDraft(userId, problemId, language as ProgrammingLanguage, code);
    sendSuccess(res, 'Draft saved', result);
  } catch (err) {
    next(err);
  }
});

router.get('/draft/:problemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const drafts = await codeDraftService.getDraftsForProblem(userId, req.params.problemId);
    sendSuccess(res, 'Drafts fetched', drafts);
  } catch (err) {
    next(err);
  }
});

router.get('/draft/:problemId/:language', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const lang = req.params.language.toUpperCase() as ProgrammingLanguage;
    const draft = await codeDraftService.getDraft(userId, req.params.problemId, lang);
    sendSuccess(res, draft ? 'Draft fetched' : 'No draft found', draft);
  } catch (err) {
    next(err);
  }
});

router.delete('/draft/:problemId/:language', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const lang = req.params.language.toUpperCase() as ProgrammingLanguage;
    await codeDraftService.deleteDraft(userId, req.params.problemId, lang);
    sendSuccess(res, 'Draft deleted', null);
  } catch (err) {
    next(err);
  }
});

export default router;
