import { z } from 'zod';
import { ProblemDifficulty } from '@prisma/client';

export const codingSearchQuerySchema = z.object({
  query: z.object({
    q: z.string({ required_error: 'Search query is required' }).min(1, 'Search query cannot be empty').max(300),
    difficulty: z.nativeEnum(ProblemDifficulty).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export type CodingSearchQuery = z.infer<typeof codingSearchQuerySchema>['query'];
