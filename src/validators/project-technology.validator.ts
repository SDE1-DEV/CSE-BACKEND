import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createTechnologySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(1, 'Name cannot be empty')
      .max(100)
      .trim(),
    slug: z
      .string({ required_error: 'Slug is required' })
      .min(1)
      .max(100)
      .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
      .trim(),
    icon: z.string().max(500).optional().nullable(),
  }),
});

export const updateTechnologySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    slug: z.string().min(1).max(100).regex(slugRegex).trim().optional(),
    icon: z.string().max(500).optional().nullable(),
  }),
});

export const technologyParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

export const getTechnologiesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().max(200).optional(),
  }),
});

export type CreateTechnologyInput = z.infer<typeof createTechnologySchema>['body'];
export type UpdateTechnologyInput = z.infer<typeof updateTechnologySchema>['body'];
