import { z } from 'zod';

export const createDiscussionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid problem ID'),
  }),
  body: z.object({
    content: z
      .string({ required_error: 'Content is required' })
      .min(1, 'Content cannot be empty')
      .max(10000, 'Content must not exceed 10000 characters'),
  }),
});

export const updateDiscussionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid discussion ID'),
  }),
  body: z.object({
    content: z
      .string({ required_error: 'Content is required' })
      .min(1, 'Content cannot be empty')
      .max(10000),
  }),
});

export const discussionParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

export const getDiscussionsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export type CreateDiscussionInput = z.infer<typeof createDiscussionSchema>['body'];
export type UpdateDiscussionInput = z.infer<typeof updateDiscussionSchema>['body'];
export type GetDiscussionsQuery = z.infer<typeof getDiscussionsQuerySchema>['query'];
