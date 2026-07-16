import { z } from 'zod';

export const createSectionSchema = z.object({
  body: z.object({
    roadmapId: z.string({ required_error: 'Roadmap ID is required' }).uuid('Invalid roadmap ID'),
    title: z
      .string({ required_error: 'Title is required' })
      .min(1, 'Title cannot be empty')
      .max(300, 'Title must not exceed 300 characters')
      .trim(),
    description: z.string().max(2000).optional().nullable(),
    order: z
      .number()
      .int('Order must be an integer')
      .min(0, 'Order cannot be negative')
      .optional()
      .default(0),
  }),
});

export const updateSectionSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }).uuid('Invalid ID format'),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(300)
      .trim()
      .optional(),
    description: z.string().max(2000).optional().nullable(),
    order: z
      .number()
      .int('Order must be an integer')
      .min(0, 'Order cannot be negative')
      .optional(),
  }),
});

export const sectionParamsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }).uuid('Invalid ID format'),
  }),
});

export const sectionByRoadmapSchema = z.object({
  params: z.object({
    roadmapId: z
      .string({ required_error: 'Roadmap ID is required' })
      .uuid('Invalid roadmap ID'),
  }),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>['body'];
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>['body'];
