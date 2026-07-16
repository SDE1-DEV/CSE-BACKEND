import { z } from 'zod';
import { ProgrammingLanguage } from '@prisma/client';

export const createCodeTemplateSchema = z.object({
  body: z.object({
    problemId: z.string({ required_error: 'Problem ID is required' }).uuid('Invalid problem ID'),
    language: z.nativeEnum(ProgrammingLanguage, { required_error: 'Language is required' }),
    template: z.string({ required_error: 'Template is required' }).min(1, 'Template cannot be empty').max(50000),
  }),
});

export const updateCodeTemplateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
  body: z.object({
    language: z.nativeEnum(ProgrammingLanguage).optional(),
    template: z.string().min(1).max(50000).optional(),
  }),
});

export const codeTemplateParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

export type CreateCodeTemplateInput = z.infer<typeof createCodeTemplateSchema>['body'];
export type UpdateCodeTemplateInput = z.infer<typeof updateCodeTemplateSchema>['body'];
