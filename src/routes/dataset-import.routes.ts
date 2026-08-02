/**
 * FPRD-17 Phase 18 — Dataset Import Pipeline Routes
 *
 * POST /dataset-import/upload  — Upload JSON dataset and trigger import
 * POST /dataset-import/json    — Import problems from JSON body
 * GET  /dataset-import         — List all imports
 * GET  /dataset-import/:id     — Import detail with report
 *
 * Only MANAGER and SUPER_ADMIN can import datasets.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { SourceType } from '@prisma/client';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { sendSuccess, sendCreated } from '../utils/response';
import { datasetImportService, ImportProblemSchema } from '../services/dataset-import.service';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../constants';

const router = Router();

// Only managers can import datasets
router.use(authenticate, requireManager);

// Multer for JSON file uploads
const upload = multer({
  dest: 'uploads/imports/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/json' || path.extname(file.originalname) === '.json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  },
});

// Validator for JSON body import
const importBodySchema = z.object({
  body: z.object({
    sourceType: z.nativeEnum(SourceType).optional().default('ORIGINAL'),
    problems: z.array(z.object({
      title: z.string().min(1).max(200),
      slug: z.string().min(1).max(80).optional(),
      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
      topic: z.string().min(1),
      statement: z.string().min(10),
      inputFormat: z.string().optional(),
      outputFormat: z.string().optional(),
      constraints: z.string().optional(),
      notes: z.string().optional(),
      examples: z.array(z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().optional(),
      })).min(1),
      hints: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      companies: z.array(z.string()).optional(),
      starterCode: z.record(z.string()).optional(),
      visibleTests: z.array(z.object({
        input: z.string(),
        output: z.string(),
      })).min(1),
      hiddenTests: z.array(z.object({
        input: z.string(),
        output: z.string(),
      })).default([]),
      timeLimit: z.number().min(500).max(30000).optional(),
      memoryLimit: z.number().min(32).max(1024).optional(),
      xp: z.number().optional(),
      estimatedTime: z.number().optional(),
      license: z.string().optional(),
      sourceType: z.nativeEnum(SourceType).optional(),
    })).min(1).max(10000),
  }),
});

// ─── POST /dataset-import/json — Import from JSON body ───────────────────────
router.post('/json', validate(importBodySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { problems, sourceType } = req.body as { problems: ImportProblemSchema[]; sourceType: SourceType };

    const report = await datasetImportService.importProblems(
      problems,
      userId,
      sourceType ?? 'ORIGINAL',
      'json-body-import',
    );

    sendCreated(res, `Import completed: ${report.imported}/${report.total} problems imported`, report);
  } catch (err) {
    next(err);
  }
});

// ─── POST /dataset-import/upload — Import from uploaded JSON file ─────────────
router.post('/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;

    if (!req.file) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'JSON file is required');
    }

    const sourceType = (req.body.sourceType as SourceType) ?? 'ORIGINAL';
    const filename = req.file.originalname;

    // Read and parse the uploaded JSON file
    let problems: ImportProblemSchema[];
    try {
      const content = fs.readFileSync(req.file.path, 'utf-8');
      const parsed = JSON.parse(content);
      // Support both array format and { problems: [...] } format
      problems = Array.isArray(parsed) ? parsed : parsed.problems;
      if (!Array.isArray(problems)) {
        throw new Error('JSON must be an array of problems or { problems: [...] }');
      }
    } catch (parseErr) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, `Invalid JSON: ${(parseErr as Error).message}`);
    } finally {
      // Cleanup uploaded file
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {}); // fire-and-forget
      }
    }

    if (problems.length > 10000) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Maximum 10,000 problems per import batch');
    }

    const report = await datasetImportService.importProblems(problems, userId, sourceType, filename);

    sendCreated(res, `Import completed: ${report.imported}/${report.total} problems imported`, report);
  } catch (err) {
    next(err);
  }
});

// ─── GET /dataset-import — List all imports ───────────────────────────────────
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
    const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);
    const result = await datasetImportService.getImports(undefined, page, limit);
    sendSuccess(res, 'Import records fetched', result);
  } catch (err) {
    next(err);
  }
});

// ─── GET /dataset-import/:id — Import detail ──────────────────────────────────
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await datasetImportService.getImportById(req.params.id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Import record not found' });
      return;
    }
    sendSuccess(res, 'Import detail fetched', record);
  } catch (err) {
    next(err);
  }
});

export default router;
