import { Router } from 'express';
import { createTestCase, updateTestCase, deleteTestCase } from '../controllers/test-case.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createTestCaseSchema,
  updateTestCaseSchema,
  testCaseParamsSchema,
} from '../validators/test-case.validator';

const router = Router();

router.post('/', authenticate, requireAdmin, validate(createTestCaseSchema), createTestCase);
router.put('/:id', authenticate, requireAdmin, validate(updateTestCaseSchema), updateTestCase);
router.delete('/:id', authenticate, requireAdmin, validate(testCaseParamsSchema), deleteTestCase);

export default router;
