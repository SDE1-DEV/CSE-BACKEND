import { Router } from 'express';
import {
  createResumeSection,
  updateResumeSection,
  deleteResumeSection,
} from '../controllers/resume-section.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createResumeSectionSchema,
  updateResumeSectionSchema,
  resumeSectionParamsSchema,
} from '../validators/resume-section.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Resume Sections
 *   description: Manage individual sections of a resume
 */

router.post('/', authenticate, requireStudent, validate(createResumeSectionSchema), createResumeSection);
router.put('/:id', authenticate, requireStudent, validate(updateResumeSectionSchema), updateResumeSection);
router.delete('/:id', authenticate, requireStudent, validate(resumeSectionParamsSchema), deleteResumeSection);

export default router;
