import { z } from 'zod';

export const sendInvitationSchema = z.object({
  body: z.object({
    teamId: z.string({ required_error: 'Team ID is required' }).uuid(),
    receiverId: z.string({ required_error: 'Receiver user ID is required' }).uuid(),
    expiresInDays: z.number().int().min(1).max(30).optional().default(7),
  }),
});

export const updateInvitationSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED'], {
      required_error: 'Status is required',
    }),
  }),
});

export const invitationParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const getInvitationsQuerySchema = z.object({
  query: z.object({
    type: z.enum(['sent', 'received']).optional().default('received'),
  }),
});

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>['body'];
export type UpdateInvitationInput = z.infer<typeof updateInvitationSchema>['body'];
