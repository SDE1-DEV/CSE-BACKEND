import { z } from 'zod';

export const createDailyChallengeSchema = z.object({
  body: z.object({
    problemId: z.string({ required_error: 'Problem ID is required' }).uuid('Invalid problem ID'),
    challengeDate: z
      .string({ required_error: 'Challenge date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    bonusXP: z.number().int().min(0).optional().default(50),
  }),
});

export const updateDailyChallengeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
  body: z.object({
    problemId: z.string().uuid('Invalid problem ID').optional(),
    challengeDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    bonusXP: z.number().int().min(0).optional(),
  }),
});

export const dailyChallengeParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

export type CreateDailyChallengeInput = z.infer<typeof createDailyChallengeSchema>['body'];
export type UpdateDailyChallengeInput = z.infer<typeof updateDailyChallengeSchema>['body'];
