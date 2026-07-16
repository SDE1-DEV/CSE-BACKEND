import { Router } from 'express';
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
} from '../controllers/job-posting.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createJobSchema,
  updateJobSchema,
  jobParamsSchema,
} from '../validators/job-posting.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job and Internship Listings
 */

// Public: list and view (filtering done in service, only published shown to non-admins)
router.get('/', getJobs);
router.get('/:id', validate(jobParamsSchema), getJobById);

// Admin only
router.post('/', authenticate, requireAdmin, validate(createJobSchema), createJob);
router.put('/:id', authenticate, requireAdmin, validate(updateJobSchema), updateJob);
router.delete('/:id', authenticate, requireAdmin, validate(jobParamsSchema), deleteJob);

export default router;
