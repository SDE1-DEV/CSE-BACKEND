import { z } from 'zod';

export const createTestCaseSchema = z.object({
  body: z.object({
    problemId: z.string({ required_error: 'Problem ID is required' }).uuid('Invalid problem ID'),
    input: z.string({ required_error: 'Input is required' }).min(0).max(10000),
    expectedOutput: z.string({ required_error: 'Expected output is required' }).min(0).max(10000),
    isSample: z.boolean().optional().default(false),
    isHidden: z.boolean().optional().default(false),
    weight: z.number().int().min(1).optional().default(1),
  }),
});

export const updateTestCaseSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
  body: z.object({
    input: z.string().min(0).max(10000).optional(),
    expectedOutput: z.string().min(0).max(10000).optional(),
    isSample: z.boolean().optional(),
    isHidden: z.boolean().optional(),
    weight: z.number().int().min(1).optional(),
  }),
});

export const testCaseParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

export const problemIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid problem ID'),
  }),
});

export type CreateTestCaseInput = z.infer<typeof createTestCaseSchema>['body'];
export type UpdateTestCaseInput = z.infer<typeof updateTestCaseSchema>['body'];
