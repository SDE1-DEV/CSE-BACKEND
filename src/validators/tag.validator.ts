import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createTagSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(1).max(100).trim(),
    slug: z
      .string({ required_error: 'Slug is required' })
      .min(1)
      .max(100)
      .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
      .trim(),
  }),
});

export const updateTagSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    slug: z.string().min(1).max(100).regex(slugRegex).trim().optional(),
  }),
});

export const tagParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

export type CreateTagInput = z.infer<typeof createTagSchema>['body'];
export type UpdateTagInput = z.infer<typeof updateTagSchema>['body'];
