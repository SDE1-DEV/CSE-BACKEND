import { z } from 'zod';
import { Difficulty } from '@prisma/client';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createRoadmapSchema = z.object({
  body: z.object({
    categoryId: z
      .string({ required_error: 'Category ID is required' })
      .uuid('Invalid category ID'),
    title: z
      .string({ required_error: 'Title is required' })
      .min(1, 'Title cannot be empty')
      .max(300, 'Title must not exceed 300 characters')
      .trim(),
    slug: z
      .string({ required_error: 'Slug is required' })
      .min(1, 'Slug cannot be empty')
      .max(300, 'Slug must not exceed 300 characters')
      .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
      .trim(),
    description: z.string().max(2000, 'Description must not exceed 2000 characters').optional().nullable(),
    thumbnail: z.string().url('Thumbnail must be a valid URL').optional().nullable(),
    difficulty: z.nativeEnum(Difficulty).optional().default(Difficulty.BEGINNER),
    estimatedHours: z
      .number()
      .int('Estimated hours must be an integer')
      .min(1, 'Estimated hours must be positive')
      .optional()
      .nullable(),
    prerequisites: z.string().max(2000).optional().nullable(),
    displayOrder: z
      .number()
      .int('Display order must be an integer')
      .min(0, 'Display order cannot be negative')
      .optional()
      .default(0),
    isPublished: z.boolean().optional().default(false),
  }),
});

export const updateRoadmapSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }).uuid('Invalid ID format'),
  }),
  body: z.object({
    categoryId: z.string().uuid('Invalid category ID').optional(),
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(300)
      .trim()
      .optional(),
    slug: z
      .string()
      .min(1, 'Slug cannot be empty')
      .max(300)
      .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
      .trim()
      .optional(),
    description: z.string().max(2000).optional().nullable(),
    thumbnail: z.string().url('Thumbnail must be a valid URL').optional().nullable(),
    difficulty: z.nativeEnum(Difficulty).optional(),
    estimatedHours: z
      .number()
      .int()
      .min(1, 'Estimated hours must be positive')
      .optional()
      .nullable(),
    prerequisites: z.string().max(2000).optional().nullable(),
    displayOrder: z
      .number()
      .int()
      .min(0, 'Display order cannot be negative')
      .optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const roadmapParamsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }).uuid('Invalid ID format'),
  }),
});

export const getRoadmapsQuerySchema = z.object({
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
    categoryId: z.string().uuid('Invalid category ID').optional(),
    difficulty: z.nativeEnum(Difficulty).optional(),
    search: z.string().max(200).optional(),
    isPublished: z
      .string()
      .transform((v) => v === 'true')
      .optional(),
    sortBy: z.enum(['displayOrder', 'createdAt', 'title', 'estimatedHours']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export type CreateRoadmapInput = z.infer<typeof createRoadmapSchema>['body'];
export type UpdateRoadmapInput = z.infer<typeof updateRoadmapSchema>['body'];
export type GetRoadmapsQuery = z.infer<typeof getRoadmapsQuerySchema>['query'];
