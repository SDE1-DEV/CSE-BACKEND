import { z } from 'zod';

export const createCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
  body: z.object({
    content: z
      .string({ required_error: 'Content is required' })
      .min(1, 'Content cannot be empty')
      .max(5000)
      .trim(),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid comment ID'),
  }),
  body: z.object({
    content: z
      .string({ required_error: 'Content is required' })
      .min(1, 'Content cannot be empty')
      .max(5000)
      .trim(),
  }),
});

export const commentParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getCommentsQuerySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});
