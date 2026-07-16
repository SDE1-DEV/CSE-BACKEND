import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const urlOrEmpty = z.string().url('Must be a valid URL').optional().nullable();

export const createProjectSchema = z.object({
  body: z.object({
    categoryId: z.string({ required_error: 'Category ID is required' }).uuid(),
    title: z
      .string({ required_error: 'Title is required' })
      .min(1)
      .max(300)
      .trim(),
    slug: z
      .string({ required_error: 'Slug is required' })
      .min(1)
      .max(300)
      .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
      .trim(),
    description: z.string().max(2000).optional().nullable(),
    overview: z.string().optional().nullable(),
    difficulty: z
      .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
      .optional()
      .default('BEGINNER'),
    estimatedDuration: z.string().max(100).optional().nullable(),
    thumbnail: urlOrEmpty,
    githubRepository: urlOrEmpty,
    liveDemo: urlOrEmpty,
    documentationUrl: urlOrEmpty,
    requirements: z.string().optional().nullable(),
    learningOutcomes: z.string().optional().nullable(),
    isPublished: z.boolean().optional().default(false),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    categoryId: z.string().uuid().optional(),
    title: z.string().min(1).max(300).trim().optional(),
    slug: z.string().min(1).max(300).regex(slugRegex).trim().optional(),
    description: z.string().max(2000).optional().nullable(),
    overview: z.string().optional().nullable(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
    estimatedDuration: z.string().max(100).optional().nullable(),
    thumbnail: urlOrEmpty,
    githubRepository: urlOrEmpty,
    liveDemo: urlOrEmpty,
    documentationUrl: urlOrEmpty,
    requirements: z.string().optional().nullable(),
    learningOutcomes: z.string().optional().nullable(),
    isPublished: z.boolean().optional(),
  }),
});

export const projectParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getProjectsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    categoryId: z.string().uuid().optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
    technologyId: z.string().uuid().optional(),
    search: z.string().max(300).optional(),
    isPublished: z.string().transform((v) => v === 'true').optional(),
  }),
});

export const projectTechnologyParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    technologyId: z.string().uuid(),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
