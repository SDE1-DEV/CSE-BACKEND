import { Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { sendSuccess } from '../utils/response';
import { PLACEMENT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User Notifications
 */

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) ?? '1', 10);
    const limit = parseInt((req.query.limit as string) ?? '20', 10);
    const userId = req.user!.userId;

    // Run both queries in parallel
    const [result, unreadCount] = await Promise.all([
      notificationService.getAll(userId, page, Math.min(limit, 50)),
      notificationService.getUnreadCount(userId),
    ]);

    // Ensure consistent paginated response shape
    const paginated = typeof result === 'object' && result !== null && 'data' in result
      ? { ...(result as Record<string, unknown>), unreadCount }
      : { data: result, total: 0, page, limit, totalPages: 1, hasNext: false, hasPrevious: false, unreadCount };

    sendSuccess(res, PLACEMENT_MESSAGES.NOTIFICATIONS_FETCHED, paginated);
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notification = await notificationService.markRead(req.params.id, req.user!.userId);
    sendSuccess(res, PLACEMENT_MESSAGES.NOTIFICATION_READ, notification);
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationService.markAllRead(req.user!.userId);
    sendSuccess(res, PLACEMENT_MESSAGES.NOTIFICATIONS_READ_ALL, null);
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationService.delete(req.params.id, req.user!.userId);
    sendSuccess(res, PLACEMENT_MESSAGES.NOTIFICATION_DELETED, null);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const count = await notificationService.getUnreadCount(userId);
    sendSuccess(res, 'Unread count fetched', { count });
  } catch (error) {
    next(error);
  }
};

export const deleteAllReadNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await notificationService.deleteAllRead(userId);
    sendSuccess(res, 'Read notifications cleared', null);
  } catch (error) {
    next(error);
  }
};
