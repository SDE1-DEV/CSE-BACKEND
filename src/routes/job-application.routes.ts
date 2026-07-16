import { Router } from 'express';
import {
  createApplication,
  getApplications,
  updateApplication,
  deleteApplication,
} from '../controllers/job-application.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createJobApplicationSchema,
  updateJobApplicationSchema,
  jobApplicationParamsSchema,
} from '../validators/job-application.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Job Applications
 *   description: Application Tracker
 */

router.post('/', authenticate, requireStudent, validate(createJobApplicationSchema), createApplication);
router.get('/', authenticate, requireStudent, getApplications);
router.patch('/:id', authenticate, requireStudent, validate(updateJobApplicationSchema), updateApplication);
router.delete('/:id', authenticate, requireStudent, validate(jobApplicationParamsSchema), deleteApplication);

export default router;
