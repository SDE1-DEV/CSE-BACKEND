import { z } from 'zod';

export const createResumeSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(1).max(200).trim(),
    template: z.string().max(100).default('default'),
    resumeUrl: z.string().url('Must be a valid URL').optional().nullable(),
    atsScore: z.number().int().min(0).max(100).optional().nullable(),
    isDefault: z.boolean().default(false),
  }),
});

export const updateResumeSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid ID') }),
  body: z.object({
    title: z.string().min(1).max(200).trim().optional(),
    template: z.string().max(100).optional(),
    resumeUrl: z.string().url().optional().nullable(),
    atsScore: z.number().int().min(0).max(100).optional().nullable(),
    isDefault: z.boolean().optional(),
  }),
});

export const resumeParamsSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid ID') }),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>['body'];
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>['body'];
