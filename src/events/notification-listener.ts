/**
 * Notification Listener
 * PRD-05: notifications generated from domain events
 * PRD-06: notifications delivered via background queue + WebSocket
 */

import { NotificationType } from '@prisma/client';
import { logger } from '../utils/logger';
import { platformEventEmitter } from './platform-events';
import { enqueueNotification } from '../queues/notification.queue';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { enqueueEmail } from '../queues/email.queue';
import { cacheService, CacheKeys } from '../services/cache.service';

const queueNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  metadata?: Record<string, unknown>,
): Promise<void> => {
  try {
    await enqueueNotification({ userId, title, message, type, metadata });
    // Immediately invalidate the cached unread count
    await cacheService.del(CacheKeys.NOTIFICATION_COUNT(userId));
  } catch (err) {
    logger.error('Failed to queue notification', { userId, type, err });
  }
};

export const registerNotificationListeners = (): void => {

  platformEventEmitter.on('application:created', async ({ userId, jobId, applicationId, jobTitle }) => {
    await queueNotification(
      userId,
      'Application Tracked',
      `Your application for "${jobTitle}" has been saved.`,
      NotificationType.PLACEMENT,
      { jobId, applicationId },
    );
  });

  platformEventEmitter.on('event:registered', async ({ userId, eventId, eventTitle }) => {
    await queueNotification(
      userId,
      'Event Registration Confirmed',
      `You have successfully registered for "${eventTitle}".`,
      NotificationType.EVENT,
      { eventId },
    );
  });

  platformEventEmitter.on('resume:created', async ({ userId, resumeId, resumeTitle }) => {
    await queueNotification(
      userId,
      'Resume Created',
      `Your resume "${resumeTitle}" has been created.`,
      NotificationType.PLACEMENT,
      { resumeId },
    );
  });

  platformEventEmitter.on('job:published', async ({ jobId, jobTitle, companyName }) => {
    logger.info('Job published event — no per-user notification (broadcast handled by admin)', {
      jobId, jobTitle, companyName,
    });
  });

  logger.info('Notification listeners registered');
};
