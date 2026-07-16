import { z } from 'zod';

const jobTypeValues = ['INTERNSHIP', 'FULL_TIME', 'PART_TIME'] as const;
const workModeValues = ['REMOTE', 'HYBRID', 'ONSITE'] as const;

export const createJobSchema = z.object({
  body: z.object({
    companyId: z.string({ required_error: 'Company ID is required' }).uuid('Invalid company ID'),
    title: z.string({ required_error: 'Title is required' }).min(1).max(300).trim(),
    type: z.enum(jobTypeValues, { required_error: 'Job type is required' }),
    location: z.string().max(200).trim().optional(),
    workMode: z.enum(workModeValues).default('ONSITE'),
    description: z.string({ required_error: 'Description is required' }).min(1).trim(),
    requirements: z.string().optional(),
    salaryRange: z.string().max(100).optional(),
    applicationUrl: z.string().url('Must be a valid URL').optional(),
    applicationDeadline: z.string().datetime({ message: 'Must be a valid ISO date' }).optional(),
    experienceRequired: z.string().max(100).optional(),
    isPublished: z.boolean().default(false),
  }),
});

export const updateJobSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid ID') }),
  body: z.object({
    title: z.string().min(1).max(300).trim().optional(),
    type: z.enum(jobTypeValues).optional(),
    location: z.string().max(200).trim().optional().nullable(),
    workMode: z.enum(workModeValues).optional(),
    description: z.string().min(1).optional(),
    requirements: z.string().optional().nullable(),
    salaryRange: z.string().max(100).optional().nullable(),
    applicationUrl: z.string().url().optional().nullable(),
    applicationDeadline: z.string().datetime().optional().nullable(),
    experienceRequired: z.string().max(100).optional().nullable(),
    isPublished: z.boolean().optional(),
  }),
});

export const jobParamsSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid ID') }),
});

export const jobQuerySchema = z.object({
  query: z.object({
    companyId: z.string().uuid().optional(),
    location: z.string().optional(),
    type: z.enum(jobTypeValues).optional(),
    workMode: z.enum(workModeValues).optional(),
    experienceRequired: z.string().optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  }),
});

export type CreateJobInput = z.infer<typeof createJobSchema>['body'];
export type UpdateJobInput = z.infer<typeof updateJobSchema>['body'];
