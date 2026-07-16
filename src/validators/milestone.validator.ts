import { z } from 'zod';

export const createMilestoneSchema = z.object({
  body: z.object({
    projectId: z.string({ required_error: 'Project ID is required' }).uuid(),
    title: z
      .string({ required_error: 'Title is required' })
      .min(1, 'Title cannot be empty')
      .max(500)
      .trim(),
    description: z.string().max(5000).optional().nullable(),
    dueDate: z
      .string()
      .datetime({ message: 'Due date must be a valid ISO datetime' })
      .refine((d) => new Date(d) > new Date(), { message: 'Due date must be in the future' })
      .optional()
      .nullable(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional().default('PENDING'),
    completionPercentage: z.number().min(0).max(100).optional().default(0),
  }),
});

export const updateMilestoneSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(1).max(500).trim().optional(),
    description: z.string().max(5000).optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
    completionPercentage: z.number().min(0).max(100).optional(),
  }),
});

export const milestoneParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getMilestonesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    projectId: z.string().uuid().optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  }),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>['body'];
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>['body'];
