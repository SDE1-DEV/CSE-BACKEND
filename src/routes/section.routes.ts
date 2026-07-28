import { Router } from 'express';
import {
  getSectionsByRoadmap,
  createSection,
  updateSection,
  deleteSection,
} from '../controllers/section.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createSectionSchema,
  updateSectionSchema,
  sectionParamsSchema,
  sectionByRoadmapSchema,
} from '../validators/section.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sections
 *   description: Roadmap section management
 */

// Public / optional-auth
router.get('/:roadmapId', validate(sectionByRoadmapSchema), getSectionsByRoadmap);

// Admin protected
router.post('/', authenticate, requireManager, validate(createSectionSchema), createSection);
router.put('/:id', authenticate, requireManager, validate(updateSectionSchema), updateSection);
router.delete('/:id', authenticate, requireManager, validate(sectionParamsSchema), deleteSection);

export default router;
