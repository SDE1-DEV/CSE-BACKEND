import { z } from 'zod';

// Valid section types — kept for documentation and future enum validation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _sectionTypes = [
  'Education', 'Experience', 'Skills', 'Projects', 'Certifications',
  'Achievements', 'Summary', 'Languages', 'Publications', 'Volunteer', 'Awards', 'Custom',
] as const;

export const createResumeSectionSchema = z.object({
  body: z.object({
    resumeId: z.string({ required_error: 'Resume ID is required' }).uuid('Invalid resume ID'),
    sectionType: z.string({ required_error: 'Section type is required' }).min(1).max(100),
    content: z.record(z.unknown(), { required_error: 'Content is required' }),
    order: z.number().int().min(0).default(0),
  }),
});

export const updateResumeSectionSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid ID') }),
  body: z.object({
    sectionType: z.string().min(1).max(100).optional(),
    content: z.record(z.unknown()).optional(),
    order: z.number().int().min(0).optional(),
  }),
});

export const resumeSectionParamsSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid ID') }),
});

export type CreateResumeSectionInput = z.infer<typeof createResumeSectionSchema>['body'];
export type UpdateResumeSectionInput = z.infer<typeof updateResumeSectionSchema>['body'];
