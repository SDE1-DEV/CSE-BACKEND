/**
 * Notification Processing Queue
 * PRD-06: Section 2 — Background Job Queue
 */

import { Job } from 'bullmq';
import { createQueue, createWorker, QUEUE_NAMES } from './queue.config';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { wsGateway } from '../websocket/gateway';
import { NotificationType } from '@prisma/client';

export interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export const notificationQueue = createQueue(QUEUE_NAMES.NOTIFICATION);

export const enqueueNotification = async (
  data: NotificationJobData,
  opts?: { delay?: number },
): Promise<void> => {
  try {
    await notificationQueue.add('notification:create', data, opts?.delay ? { delay: opts.delay } : undefined);
  } catch (err) {
    logger.error('Failed to enqueue notification', { error: (err as Error).message });
  }
};

const processNotificationJob = async (job: Job<NotificationJobData>): Promise<void> => {
  const { userId, title, message, type, metadata } = job.data;

  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type: type as NotificationType,
      ...(metadata ? { metadata: metadata as import('@prisma/client').Prisma.InputJsonValue } : {}),
    },
  });

  // Push real-time notification via WebSocket
  wsGateway.emitToUser(userId, 'notification:new', {
    id: notification.id,
    title,
    message,
    type,
    createdAt: notification.createdAt,
  });

  logger.info('Notification created', { userId, notificationId: notification.id });
};

export const startNotificationWorker = (): void => {
  createWorker<NotificationJobData>(QUEUE_NAMES.NOTIFICATION, processNotificationJob, 10);
  logger.info('Notification worker started');
};
