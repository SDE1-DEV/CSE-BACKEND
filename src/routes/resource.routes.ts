import { Router } from 'express';
import {
  getResourcesByLesson,
  createResource,
  updateResource,
  deleteResource,
} from '../controllers/resource.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createResourceSchema,
  updateResourceSchema,
  resourceParamsSchema,
  resourcesByLessonSchema,
} from '../validators/resource.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Resources
 *   description: Lesson resource management
 */

// Public
router.get('/:lessonId', validate(resourcesByLessonSchema), getResourcesByLesson);

// Admin protected
router.post('/', authenticate, requireAdmin, validate(createResourceSchema), createResource);
router.put('/:id', authenticate, requireAdmin, validate(updateResourceSchema), updateResource);
router.delete('/:id', authenticate, requireAdmin, validate(resourceParamsSchema), deleteResource);

export default router;
