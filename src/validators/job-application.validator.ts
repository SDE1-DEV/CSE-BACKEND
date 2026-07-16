import { z } from 'zod';

const statusValues = [
  'SAVED',
  'APPLIED',
  'OA_SCHEDULED',
  'INTERVIEW',
  'HR_ROUND',
  'OFFERED',
  'REJECTED',
  'WITHDRAWN',
] as const;

export const createJobApplicationSchema = z.object({
  body: z.object({
    jobId: z.string({ required_error: 'Job ID is required' }).uuid('Invalid job ID'),
    status: z.enum(statusValues).default('SAVED'),
    notes: z.string().max(2000).optional(),
  }),
});

export const updateJobApplicationSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid ID') }),
  body: z.object({
    status: z.enum(statusValues).optional(),
    notes: z.string().max(2000).optional().nullable(),
  }),
});

export const jobApplicationParamsSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid ID') }),
});

export type CreateJobApplicationInput = z.infer<typeof createJobApplicationSchema>['body'];
export type UpdateJobApplicationInput = z.infer<typeof updateJobApplicationSchema>['body'];
