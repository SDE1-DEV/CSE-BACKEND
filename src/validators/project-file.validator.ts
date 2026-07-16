import { z } from 'zod';

export const uploadProjectFileSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'File title is required' })
      .min(1, 'Title cannot be empty')
      .max(300)
      .trim(),
  }),
  params: z.object({
    projectId: z.string().uuid('Invalid project ID'),
  }),
});

export const getProjectFilesQuerySchema = z.object({
  params: z.object({
    projectId: z.string().uuid(),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export const projectFileParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type UploadProjectFileInput = z.infer<typeof uploadProjectFileSchema>['body'];
