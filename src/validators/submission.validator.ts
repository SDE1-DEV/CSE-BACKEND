import { z } from 'zod';
import { ProgrammingLanguage } from '@prisma/client';

export const createSubmissionSchema = z.object({
  body: z.object({
    problemId: z.string({ required_error: 'Problem ID is required' }).uuid('Invalid problem ID'),
    language: z.nativeEnum(ProgrammingLanguage, { required_error: 'Language is required' }),
    sourceCode: z
      .string({ required_error: 'Source code is required' })
      .min(1, 'Source code cannot be empty')
      .max(100000, 'Source code exceeds maximum size'),
  }),
});

export const getSubmissionsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    problemId: z.string().uuid().optional(),
    language: z.nativeEnum(ProgrammingLanguage).optional(),
    status: z.string().optional(),
  }),
});

export const submissionParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid submission ID'),
  }),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>['body'];
export type GetSubmissionsQuery = z.infer<typeof getSubmissionsQuerySchema>['query'];
