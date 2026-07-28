import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
} from '../controllers/event.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager, requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createEventSchema,
  updateEventSchema,
  eventParamsSchema,
} from '../validators/event.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event Management
 */

// Public: list and view events (non-admins only see published)
router.get('/', getEvents);
router.get('/:id', validate(eventParamsSchema), getEventById);

// Admin only: manage events
router.post('/', authenticate, requireManager, validate(createEventSchema), createEvent);
router.put('/:id', authenticate, requireManager, validate(updateEventSchema), updateEvent);
router.delete('/:id', authenticate, requireManager, validate(eventParamsSchema), deleteEvent);

// Student: register/unregister
router.post('/:id/register', authenticate, requireStudent, validate(eventParamsSchema), registerForEvent);
router.delete('/:id/register', authenticate, requireStudent, validate(eventParamsSchema), unregisterFromEvent);

export default router;
