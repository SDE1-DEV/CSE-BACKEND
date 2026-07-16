import { z } from 'zod';

// ── Promote / Demote ──────────────────────────────────────────────────────────

export const promoteUserSchema = z.object({
  body: z.object({
    reason: z.string().max(500).optional(),
    modules: z
      .object({
        learning: z.boolean().optional(),
        coding: z.boolean().optional(),
        projects: z.boolean().optional(),
        placements: z.boolean().optional(),
        events: z.boolean().optional(),
        notifications: z.boolean().optional(),
        reports: z.boolean().optional(),
      })
      .optional(),
  }),
});

export const demoteUserSchema = z.object({
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

// ── Manager Permissions ───────────────────────────────────────────────────────

export const updatePermissionsSchema = z.object({
  body: z
    .object({
      learning: z.boolean().optional(),
      coding: z.boolean().optional(),
      projects: z.boolean().optional(),
      placements: z.boolean().optional(),
      events: z.boolean().optional(),
      notifications: z.boolean().optional(),
      reports: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one permission module must be provided',
    }),
});

// ── User Status ───────────────────────────────────────────────────────────────

export const updateUserStatusSchema = z.object({
  body: z.object({
    isVerified: z.boolean({ required_error: 'isVerified is required' }),
  }),
});

// ── Notifications ─────────────────────────────────────────────────────────────

export const createNotificationSchema = z.object({
  body: z.object({
    userId: z.string().uuid({ message: 'Invalid userId' }),
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(1000),
    type: z.enum(['PLACEMENT', 'PROJECT', 'CODING', 'LEARNING', 'EVENT', 'SYSTEM']).optional(),
  }),
});

export const broadcastNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(1000),
    type: z.enum(['PLACEMENT', 'PROJECT', 'CODING', 'LEARNING', 'EVENT', 'SYSTEM']).optional(),
    targetRole: z.enum(['STUDENT', 'MANAGER']).optional(),
  }),
});

// ── Bulk Actions ──────────────────────────────────────────────────────────────

export const bulkActionSchema = z.object({
  body: z.object({
    entity: z.enum(['roadmaps', 'problems', 'projects', 'jobs', 'events']),
    ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
  }),
});

export type PromoteUserInput = z.infer<typeof promoteUserSchema>['body'];
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>['body'];
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>['body'];
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>['body'];
// ── Manager Invitation ────────────────────────────────────────────────────────

export const sendInvitationSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  }),
});

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>['body'];

export type BulkActionInput = z.infer<typeof bulkActionSchema>['body'];
