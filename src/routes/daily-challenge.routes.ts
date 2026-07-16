import { Router } from 'express';
import {
  getToday,
  createDailyChallenge,
  updateDailyChallenge,
  deleteDailyChallenge,
} from '../controllers/daily-challenge.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createDailyChallengeSchema,
  updateDailyChallengeSchema,
  dailyChallengeParamsSchema,
} from '../validators/daily-challenge.validator';

const router = Router();

router.get('/', getToday);
router.post('/', authenticate, requireAdmin, validate(createDailyChallengeSchema), createDailyChallenge);
router.put('/:id', authenticate, requireAdmin, validate(updateDailyChallengeSchema), updateDailyChallenge);
router.delete('/:id', authenticate, requireAdmin, validate(dailyChallengeParamsSchema), deleteDailyChallenge);

export default router;
