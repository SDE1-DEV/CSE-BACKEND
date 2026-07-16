import { Router } from 'express';
import {
  createSubmission,
  getSubmissions,
  getSubmissionById,
} from '../controllers/submission.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createSubmissionSchema,
  getSubmissionsQuerySchema,
  submissionParamsSchema,
} from '../validators/submission.validator';

const router = Router();

router.post('/', authenticate, requireStudent, validate(createSubmissionSchema), createSubmission);
router.get('/', authenticate, requireStudent, validate(getSubmissionsQuerySchema), getSubmissions);
router.get('/:id', authenticate, requireStudent, validate(submissionParamsSchema), getSubmissionById);

export default router;
