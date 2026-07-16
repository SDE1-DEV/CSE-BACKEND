import { z } from 'zod';

export const notificationParamsSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid ID') }),
});

export const notificationQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  }),
});
