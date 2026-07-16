import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCategorySchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(1, 'Title cannot be empty')
      .max(200, 'Title must not exceed 200 characters')
      .trim(),
    slug: z
      .string({ required_error: 'Slug is required' })
      .min(1, 'Slug cannot be empty')
      .max(200, 'Slug must not exceed 200 characters')
      .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
      .trim(),
    description: z.string().max(1000, 'Description must not exceed 1000 characters').optional().nullable(),
    icon: z.string().max(500, 'Icon must not exceed 500 characters').optional().nullable(),
    displayOrder: z
      .number()
      .int('Display order must be an integer')
      .min(0, 'Display order cannot be negative')
      .optional()
      .default(0),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }).uuid('Invalid ID format'),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title must not exceed 200 characters')
      .trim()
      .optional(),
    slug: z
      .string()
      .min(1, 'Slug cannot be empty')
      .max(200, 'Slug must not exceed 200 characters')
      .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
      .trim()
      .optional(),
    description: z.string().max(1000).optional().nullable(),
    icon: z.string().max(500).optional().nullable(),
    displayOrder: z
      .number()
      .int('Display order must be an integer')
      .min(0, 'Display order cannot be negative')
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

export const categoryParamsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }).uuid('Invalid ID format'),
  }),
});

export const getCategoriesQuerySchema = z.object({
  query: z.object({
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
    isActive: z
      .string()
      .transform((v) => v === 'true')
      .optional(),
    search: z.string().max(200).optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>['query'];
