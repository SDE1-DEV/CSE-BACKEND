import { z } from 'zod';
import { ProblemDifficulty } from '@prisma/client';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCodingProblemSchema = z.object({
  body: z.object({
    categoryId: z.string({ required_error: 'Category ID is required' }).uuid('Invalid category ID'),
    title: z.string({ required_error: 'Title is required' }).min(1).max(500).trim(),
    slug: z
      .string({ required_error: 'Slug is required' })
      .min(1)
      .max(500)
      .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
      .trim(),
    description: z.string().max(10000, 'Description must not exceed 10000 characters').optional().nullable(),
    problemStatement: z.string({ required_error: 'Problem statement is required' }).min(1, 'Problem statement cannot be empty').max(20000),
    inputFormat: z.string().max(5000).optional().nullable(),
    outputFormat: z.string().max(5000).optional().nullable(),
    constraints: z.string().max(5000).optional().nullable(),
    sampleInput: z.string().max(5000).optional().nullable(),
    sampleOutput: z.string().max(5000).optional().nullable(),
    explanation: z.string().max(10000).optional().nullable(),
    difficulty: z.nativeEnum(ProblemDifficulty).optional().default(ProblemDifficulty.EASY),
    timeLimit: z.number().int().positive('Time limit must be positive').min(100).max(10000).optional().default(1000),
    memoryLimit: z.number().int().positive('Memory limit must be positive').min(16).max(1024).optional().default(256),
    points: z.number().int().min(0).optional().default(0),
    isPublished: z.boolean().optional().default(false),
  }),
});

export const updateCodingProblemSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
  body: z.object({
    categoryId: z.string().uuid('Invalid category ID').optional(),
    title: z.string().min(1).max(500).trim().optional(),
    slug: z.string().min(1).max(500).regex(slugRegex).trim().optional(),
    description: z.string().max(10000).optional().nullable(),
    problemStatement: z.string().min(1).max(20000).optional(),
    inputFormat: z.string().max(5000).optional().nullable(),
    outputFormat: z.string().max(5000).optional().nullable(),
    constraints: z.string().max(5000).optional().nullable(),
    sampleInput: z.string().max(5000).optional().nullable(),
    sampleOutput: z.string().max(5000).optional().nullable(),
    explanation: z.string().max(10000).optional().nullable(),
    difficulty: z.nativeEnum(ProblemDifficulty).optional(),
    timeLimit: z.number().int().positive().min(100).max(10000).optional(),
    memoryLimit: z.number().int().positive().min(16).max(1024).optional(),
    points: z.number().int().min(0).optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const codingProblemParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

/**
 * Normalise a filter value that may arrive as "all", "", null, or undefined.
 * Returns undefined so the service knows to skip the filter entirely.
 */
function normalizeFilterValue(val: string | undefined): string | undefined {
  if (val === undefined || val === null || val === '' || val.toLowerCase() === 'all') {
    return undefined;
  }
  return val;
}

export const getProblemsQuerySchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).transform(Number).optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).optional(),

      // difficulty: accept both "all"/"" (→ ignored) and case-insensitive enum values
      difficulty: z
        .string()
        .optional()
        .transform((val) => {
          const normalized = normalizeFilterValue(val);
          if (!normalized) return undefined;
          // Accept both lowercase (frontend) and uppercase (Prisma enum)
          return normalized.toUpperCase() as ProblemDifficulty;
        })
        .pipe(z.nativeEnum(ProblemDifficulty).optional()),

      // categoryId: "all"/"" → ignore; otherwise must be UUID
      categoryId: z
        .string()
        .optional()
        .transform((val) => normalizeFilterValue(val))
        .pipe(z.string().uuid().optional()),

      // tagId: "all"/"" → ignore; otherwise must be UUID
      tagId: z
        .string()
        .optional()
        .transform((val) => normalizeFilterValue(val))
        .pipe(z.string().uuid().optional()),

      // companyId: "all"/"" → ignore; otherwise must be UUID
      companyId: z
        .string()
        .optional()
        .transform((val) => normalizeFilterValue(val))
        .pipe(z.string().uuid().optional()),

      search: z.string().max(300).optional(),
      isPublished: z.string().transform((v) => v === 'true').optional(),

      // solved: boolean string ("true"/"false") — legacy param
      solved: z.string().transform((v) => v === 'true').optional(),

      // status: "all"/"solved"/"unsolved" — frontend ProblemFilters shape
      status: z
        .enum(['all', 'solved', 'unsolved'])
        .optional()
        .transform((val) => (val === 'all' ? undefined : val)),

      sortBy: z.enum(['createdAt', 'difficulty', 'title', 'acceptanceRate', 'points']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    })
    // Strip unknown keys (e.g. tagIds array sent by old client versions)
    .strip(),
});

export type CreateCodingProblemInput = z.infer<typeof createCodingProblemSchema>['body'];
export type UpdateCodingProblemInput = z.infer<typeof updateCodingProblemSchema>['body'];
export type GetProblemsQuery = z.infer<typeof getProblemsQuerySchema>['query'];
