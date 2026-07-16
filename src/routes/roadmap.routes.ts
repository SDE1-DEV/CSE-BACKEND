import { Router } from 'express';
import {
  getRoadmaps,
  getRoadmapById,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
} from '../controllers/roadmap.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createRoadmapSchema,
  updateRoadmapSchema,
  roadmapParamsSchema,
  getRoadmapsQuerySchema,
} from '../validators/roadmap.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Roadmaps
 *   description: Learning roadmap management
 */

// Public / optional-auth routes (admins see unpublished too)
router.get('/', validate(getRoadmapsQuerySchema), getRoadmaps);
router.get('/:id', validate(roadmapParamsSchema), getRoadmapById);

// Admin protected routes
router.post('/', authenticate, requireAdmin, validate(createRoadmapSchema), createRoadmap);
router.put('/:id', authenticate, requireAdmin, validate(updateRoadmapSchema), updateRoadmap);
router.delete('/:id', authenticate, requireAdmin, validate(roadmapParamsSchema), deleteRoadmap);

export default router;
