/**
 * Notification Service
 * PRD-06: Redis caching for unread notification count (hot data)
 */

import { Notification } from '@prisma/client';
import { notificationRepository } from '../repositories/notification.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PLACEMENT_MESSAGES } from '../constants';
import { cacheService, CacheKeys } from './cache.service';
import { env } from '../config/env';

export class NotificationService {
  async getAll(userId: string, page: number, limit: number) {
    return notificationRepository.findByUser(userId, page, Math.min(limit, 50));
  }

  /** Cached unread count — invalidated on read/delete */
  async getUnreadCount(userId: string): Promise<number> {
    return cacheService.wrap(
      CacheKeys.NOTIFICATION_COUNT(userId),
      () => notificationRepository.countUnread(userId),
      env.CACHE_TTL_SHORT,
    );
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await notificationRepository.findById(id);
    if (!notification) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.NOTIFICATION_NOT_FOUND);
    if (notification.userId !== userId) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PLACEMENT_MESSAGES.NOTIFICATION_FORBIDDEN);
    }
    const updated = await notificationRepository.markRead(id);
    await cacheService.del(CacheKeys.NOTIFICATION_COUNT(userId));
    return updated;
  }

  async markAllRead(userId: string): Promise<void> {
    await notificationRepository.markAllRead(userId);
    await cacheService.del(CacheKeys.NOTIFICATION_COUNT(userId));
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await notificationRepository.findById(id);
    if (!notification) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.NOTIFICATION_NOT_FOUND);
    if (notification.userId !== userId) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PLACEMENT_MESSAGES.NOTIFICATION_FORBIDDEN);
    }
    await notificationRepository.delete(id);
    await cacheService.del(CacheKeys.NOTIFICATION_COUNT(userId));
  }
}

export const notificationService = new NotificationService();
