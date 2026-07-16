import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createProjectCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(1, 'Name cannot be empty')
      .max(200, 'Name must not exceed 200 characters')
      .trim(),
    slug: z
      .string({ required_error: 'Slug is required' })
      .min(1)
      .max(200)
      .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
      .trim(),
    description: z.string().max(1000).optional().nullable(),
    icon: z.string().max(500).optional().nullable(),
    displayOrder: z.number().int().min(0).optional().default(0),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateProjectCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
  body: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    slug: z.string().min(1).max(200).regex(slugRegex).trim().optional(),
    description: z.string().max(1000).optional().nullable(),
    icon: z.string().max(500).optional().nullable(),
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const projectCategoryParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

export const getProjectCategoriesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    isActive: z.string().transform((v) => v === 'true').optional(),
    search: z.string().max(200).optional(),
  }),
});

export type CreateProjectCategoryInput = z.infer<typeof createProjectCategorySchema>['body'];
export type UpdateProjectCategoryInput = z.infer<typeof updateProjectCategorySchema>['body'];
