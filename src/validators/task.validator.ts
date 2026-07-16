import { z } from 'zod';

const futureDateOrString = z
  .string()
  .datetime({ message: 'Due date must be a valid ISO datetime' })
  .refine((d) => new Date(d) > new Date(), { message: 'Due date must be in the future' })
  .optional()
  .nullable();

export const createTaskSchema = z.object({
  body: z.object({
    teamId: z.string({ required_error: 'Team ID is required' }).uuid(),
    title: z
      .string({ required_error: 'Title is required' })
      .min(1, 'Title cannot be empty')
      .max(500)
      .trim(),
    description: z.string().max(5000).optional().nullable(),
    assignedTo: z.string().uuid().optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional().default('TODO'),
    dueDate: futureDateOrString,
    estimatedHours: z.number().positive().max(1000).optional().nullable(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(1).max(500).trim().optional(),
    description: z.string().max(5000).optional().nullable(),
    assignedTo: z.string().uuid().optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    dueDate: z
      .string()
      .datetime()
      .optional()
      .nullable(),
    estimatedHours: z.number().positive().max(1000).optional().nullable(),
  }),
});

export const taskParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getTasksQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    teamId: z.string().uuid().optional(),
    assignedTo: z.string().uuid().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
