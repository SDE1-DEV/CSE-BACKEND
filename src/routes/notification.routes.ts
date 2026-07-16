import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
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
router.patch('/:id/read', authenticate, requireStudent, validate(notificationParamsSchema), markNotificationRead);
router.patch('/read-all', authenticate, requireStudent, markAllNotificationsRead);
router.delete('/:id', authenticate, requireStudent, validate(notificationParamsSchema), deleteNotification);

export default router;
