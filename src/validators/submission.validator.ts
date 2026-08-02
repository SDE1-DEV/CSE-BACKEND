/**
 * FPRD-17/18 — Updated Submission Validator
 * Supports all 10 languages from Phase 2.
 * Normalizes language to uppercase before enum validation so both
 * 'python' and 'PYTHON' are accepted from any client.
 */

import { z } from 'zod';
import { ProgrammingLanguage } from '@prisma/client';

/**
 * Preprocess: normalize language string to uppercase before enum check.
 * Handles both 'python' (frontend lowercase) and 'PYTHON' (enum value).
 */
const languageSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.toUpperCase() : val),
  z.nativeEnum(ProgrammingLanguage, { required_error: 'Language is required' }),
);

export const createSubmissionSchema = z.object({
  body: z.object({
    problemId: z.string({ required_error: 'Problem ID is required' }).uuid('Invalid problem ID'),
    language: languageSchema,
    sourceCode: z
      .string({ required_error: 'Source code is required' })
      .min(1, 'Source code cannot be empty')
      .max(100_000, 'Source code exceeds maximum size'),
  }),
});

export const runCodeSchema = z.object({
  body: z.object({
    problemId: z.string({ required_error: 'Problem ID is required' }).uuid('Invalid problem ID'),
    language: languageSchema,
    code: z
      .string({ required_error: 'Code is required' })
      .min(1, 'Code cannot be empty')
      .max(100_000, 'Code exceeds maximum size'),
    customInput: z.string().max(10_000).optional(),
  }),
});

export const getSubmissionsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    problemId: z.string().uuid().optional(),
    language: z.preprocess(
      (val) => (typeof val === 'string' ? val.toUpperCase() : val),
      z.nativeEnum(ProgrammingLanguage),
    ).optional(),
    status: z.string().optional(),
  }),
});

export const submissionParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid submission ID'),
  }),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>['body'];
export type RunCodeInput = z.infer<typeof runCodeSchema>['body'];
export type GetSubmissionsQuery = z.infer<typeof getSubmissionsQuerySchema>['query'];
