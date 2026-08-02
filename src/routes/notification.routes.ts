import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
} from '../controllers/notification.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { notificationParamsSchema } from '../validators/notification.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User Notifications
 */

router.get('/', authenticate, requireStudent, getNotifications);
// unread-count MUST be before /:id to avoid being captured by the param route
router.get('/unread-count', authenticate, requireStudent, getUnreadCount);
router.patch('/:id/read', authenticate, requireStudent, validate(notificationParamsSchema), markNotificationRead);
router.patch('/read-all', authenticate, requireStudent, markAllNotificationsRead);
router.delete('/:id', authenticate, requireStudent, validate(notificationParamsSchema), deleteNotification);

export default router;
