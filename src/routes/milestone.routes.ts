import { Router } from 'express';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone } from '../controllers/milestone.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createMilestoneSchema,
  updateMilestoneSchema,
  milestoneParamsSchema,
  getMilestonesQuerySchema,
} from '../validators/milestone.validator';

const router = Router();

router.get('/', authenticate, requireStudent, validate(getMilestonesQuerySchema), getMilestones);
router.post('/', authenticate, requireStudent, validate(createMilestoneSchema), createMilestone);
router.put('/:id', authenticate, requireStudent, validate(updateMilestoneSchema), updateMilestone);
router.delete('/:id', authenticate, requireStudent, validate(milestoneParamsSchema), deleteMilestone);

export default router;
