import { z } from 'zod';

export const adminReportQuerySchema = z.object({
  query: z.object({
    startDate: z.string().datetime({ message: 'Invalid start date' }).optional(),
    endDate: z.string().datetime({ message: 'Invalid end date' }).optional(),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    settings: z
      .array(
        z.object({
          key: z.string({ required_error: 'Key is required' }).min(1).max(200).trim(),
          value: z.string({ required_error: 'Value is required' }).max(5000),
          description: z.string().max(500).optional(),
        }),
      )
      .min(1, 'At least one setting is required'),
  }),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>['body'];
