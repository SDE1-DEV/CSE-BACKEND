import { z } from 'zod';

const eventTypeValues = ['HACKATHON', 'WEBINAR', 'WORKSHOP', 'CONTEST', 'BOOTCAMP', 'MEETUP'] as const;

export const createEventSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(1).max(300).trim(),
    description: z.string().optional(),
    type: z.enum(eventTypeValues, { required_error: 'Event type is required' }),
    organizer: z.string().max(200).optional(),
    location: z.string().max(300).optional(),
    startTime: z.string({ required_error: 'Start time is required' }).datetime('Must be a valid ISO date'),
    endTime: z.string({ required_error: 'End time is required' }).datetime('Must be a valid ISO date'),
    registrationUrl: z.string().url('Must be a valid URL').optional().nullable(),
    maxParticipants: z.number().int().positive().optional().nullable(),
    isPublished: z.boolean().default(false),
  }).refine(data => new Date(data.endTime) > new Date(data.startTime), {
    message: 'End time must be after start time',
    path: ['endTime'],
  }),
});

export const updateEventSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid ID') }),
  body: z.object({
    title: z.string().min(1).max(300).trim().optional(),
    description: z.string().optional().nullable(),
    type: z.enum(eventTypeValues).optional(),
    organizer: z.string().max(200).optional().nullable(),
    location: z.string().max(300).optional().nullable(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    registrationUrl: z.string().url().optional().nullable(),
    maxParticipants: z.number().int().positive().optional().nullable(),
    isPublished: z.boolean().optional(),
  }),
});

export const eventParamsSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid ID') }),
});

export const eventQuerySchema = z.object({
  query: z.object({
    type: z.enum(eventTypeValues).optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  }),
});

export type CreateEventInput = z.infer<typeof createEventSchema>['body'];
export type UpdateEventInput = z.infer<typeof updateEventSchema>['body'];
