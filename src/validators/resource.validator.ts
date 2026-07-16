import { z } from 'zod';
import { ResourceType } from '@prisma/client';

export const createResourceSchema = z.object({
  body: z.object({
    lessonId: z.string({ required_error: 'Lesson ID is required' }).uuid('Invalid lesson ID'),
    type: z.nativeEnum(ResourceType, { required_error: 'Resource type is required' }),
    title: z
      .string({ required_error: 'Title is required' })
      .min(1, 'Title cannot be empty')
      .max(300, 'Title must not exceed 300 characters')
      .trim(),
    url: z
      .string({ required_error: 'URL is required' })
      .url('URL must be valid')
      .max(2000, 'URL must not exceed 2000 characters'),
    duration: z
      .number()
      .int('Duration must be an integer')
      .min(1, 'Duration must be positive')
      .optional()
      .nullable(),
    author: z.string().max(200).optional().nullable(),
    thumbnail: z.string().url('Thumbnail must be a valid URL').optional().nullable(),
  }),
});

export const updateResourceSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }).uuid('Invalid ID format'),
  }),
  body: z.object({
    type: z.nativeEnum(ResourceType).optional(),
    title: z.string().min(1, 'Title cannot be empty').max(300).trim().optional(),
    url: z.string().url('URL must be valid').max(2000).optional(),
    duration: z.number().int().min(1, 'Duration must be positive').optional().nullable(),
    author: z.string().max(200).optional().nullable(),
    thumbnail: z.string().url('Thumbnail must be a valid URL').optional().nullable(),
  }),
});

export const resourceParamsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }).uuid('Invalid ID format'),
  }),
});

export const resourcesByLessonSchema = z.object({
  params: z.object({
    lessonId: z.string({ required_error: 'Lesson ID is required' }).uuid('Invalid lesson ID'),
  }),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>['body'];
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>['body'];
