import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCompanySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(1).max(200).trim(),
    slug: z
      .string({ required_error: 'Slug is required' })
      .min(1)
      .max(200)
      .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
      .trim(),
    logo: z.string().url('Logo must be a valid URL').optional().nullable(),
    website: z.string().url('Website must be a valid URL').optional().nullable(),
    // PRD-05 extensions
    description: z.string().max(5000).optional().nullable(),
    industry: z.string().max(200).optional().nullable(),
    headquarters: z.string().max(300).optional().nullable(),
    careersUrl: z.string().url('Careers URL must be a valid URL').optional().nullable(),
    verified: z.boolean().default(false),
  }),
});

export const updateCompanySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
  body: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    slug: z.string().min(1).max(200).regex(slugRegex).trim().optional(),
    logo: z.string().url('Logo must be a valid URL').optional().nullable(),
    website: z.string().url('Website must be a valid URL').optional().nullable(),
    // PRD-05 extensions
    description: z.string().max(5000).optional().nullable(),
    industry: z.string().max(200).optional().nullable(),
    headquarters: z.string().max(300).optional().nullable(),
    careersUrl: z.string().url('Careers URL must be a valid URL').optional().nullable(),
    verified: z.boolean().optional(),
  }),
});

export const companyParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>['body'];
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>['body'];
