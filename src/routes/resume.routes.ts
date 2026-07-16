import { Router } from 'express';
import {
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
  setDefaultResume,
} from '../controllers/resume.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createResumeSchema,
  updateResumeSchema,
  resumeParamsSchema,
} from '../validators/resume.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Resumes
 *   description: Resume Builder and Management
 */

router.get('/', authenticate, requireStudent, getResumes);
router.get('/:id', authenticate, requireStudent, validate(resumeParamsSchema), getResumeById);
router.post('/', authenticate, requireStudent, validate(createResumeSchema), createResume);
router.put('/:id', authenticate, requireStudent, validate(updateResumeSchema), updateResume);
router.delete('/:id', authenticate, requireStudent, validate(resumeParamsSchema), deleteResume);
router.post('/:id/default', authenticate, requireStudent, validate(resumeParamsSchema), setDefaultResume);

export default router;
