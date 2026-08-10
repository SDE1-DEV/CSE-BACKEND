import { z } from 'zod';

// ContentType was removed from @prisma/client when the old learning schema was replaced.
// Keep a local enum so legacy lesson routes don't crash at startup.
const ContentType = {
  NOTE: 'NOTE', VIDEO: 'VIDEO', ARTICLE: 'ARTICLE', QUIZ: 'QUIZ',
  ASSIGNMENT: 'ASSIGNMENT', PROJECT: 'PROJECT', CODING_PROBLEM: 'CODING_PROBLEM',
} as const;
type ContentType = typeof ContentType[keyof typeof ContentType];

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createLessonSchema = z.object({
  body: z.object({
    sectionId: z.string({ required_error: 'Section ID is required' }).uuid('Invalid section ID'),
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
    description: z.string().max(3000).optional().nullable(),
    contentType: z.nativeEnum(ContentType).optional().default(ContentType.NOTE),
    estimatedMinutes: z
      .number()
      .int('Estimated minutes must be an integer')
      .min(1, 'Estimated minutes must be positive')
      .optional()
      .nullable(),
    order: z
      .number()
      .int('Order must be an integer')
      .min(0, 'Order cannot be negative')
      .optional()
      .default(0),
    isPublished: z.boolean().optional().default(false),
  }),
});

export const updateLessonSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }).uuid('Invalid ID format'),
  }),
  body: z.object({
    sectionId: z.string().uuid('Invalid section ID').optional(),
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
    description: z.string().max(3000).optional().nullable(),
    contentType: z.nativeEnum(ContentType).optional(),
    estimatedMinutes: z
      .number()
      .int()
      .min(1, 'Estimated minutes must be positive')
      .optional()
      .nullable(),
    order: z
      .number()
      .int()
      .min(0, 'Order cannot be negative')
      .optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const lessonParamsSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }).uuid('Invalid ID format'),
  }),
});

export const lessonsBySectionSchema = z.object({
  params: z.object({
    sectionId: z.string({ required_error: 'Section ID is required' }).uuid('Invalid section ID'),
  }),
});

export const updateProgressSchema = z.object({
  params: z.object({
    id: z.string({ required_error: 'ID is required' }).uuid('Invalid ID format'),
  }),
  body: z.object({
    watchPercentage: z
      .number({ required_error: 'Watch percentage is required' })
      .min(0, 'Watch percentage cannot be negative')
      .max(100, 'Watch percentage cannot exceed 100'),
    timeSpent: z
      .number({ required_error: 'Time spent is required' })
      .int('Time spent must be an integer')
      .min(0, 'Time spent cannot be negative'),
  }),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>['body'];
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>['body'];
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>['body'];
