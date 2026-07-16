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
    const result = await notificationService.getAll(req.user!.userId, page, limit);
    sendSuccess(res, PLACEMENT_MESSAGES.NOTIFICATIONS_FETCHED, result);
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
