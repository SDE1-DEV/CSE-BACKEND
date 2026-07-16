import { z } from 'zod';

export const searchQuerySchema = z.object({
  query: z.object({
    q: z
      .string({ required_error: 'Search query is required' })
      .min(1, 'Search query cannot be empty')
      .max(200, 'Search query must not exceed 200 characters')
      .trim(),
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a positive integer')
      .transform(Number)
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive integer')
      .transform(Number)
      .optional(),
  }),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>['query'];
