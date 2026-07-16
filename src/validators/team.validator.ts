import { z } from 'zod';

export const createTeamSchema = z.object({
  body: z.object({
    projectId: z.string({ required_error: 'Project ID is required' }).uuid(),
    name: z
      .string({ required_error: 'Team name is required' })
      .min(1, 'Team name cannot be empty')
      .max(200)
      .trim(),
    maxMembers: z
      .number()
      .int()
      .min(2, 'Team must allow at least 2 members')
      .max(20, 'Team cannot exceed 20 members')
      .optional()
      .default(5),
  }),
});

export const updateTeamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(200).trim().optional(),
    maxMembers: z.number().int().min(2).max(20).optional(),
    status: z.enum(['OPEN', 'FULL', 'CLOSED', 'COMPLETED']).optional(),
  }),
});

export const teamParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const teamMemberParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    memberId: z.string().uuid(),
  }),
});

export const addMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    userId: z.string({ required_error: 'User ID is required' }).uuid(),
    role: z
      .enum(['OWNER', 'LEADER', 'DEVELOPER', 'DESIGNER', 'RESEARCHER', 'TESTER'])
      .optional()
      .default('DEVELOPER'),
  }),
});

export const updateMemberRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
    memberId: z.string().uuid(),
  }),
  body: z.object({
    role: z.enum(['LEADER', 'DEVELOPER', 'DESIGNER', 'RESEARCHER', 'TESTER'], {
      required_error: 'Role is required',
    }),
  }),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>['body'];
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>['body'];
