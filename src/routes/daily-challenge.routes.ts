import { Router } from 'express';
import {
  getToday,
  createDailyChallenge,
  updateDailyChallenge,
  deleteDailyChallenge,
} from '../controllers/daily-challenge.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createDailyChallengeSchema,
  updateDailyChallengeSchema,
  dailyChallengeParamsSchema,
} from '../validators/daily-challenge.validator';

const router = Router();

router.get('/', getToday);
router.post('/', authenticate, requireManager, validate(createDailyChallengeSchema), createDailyChallenge);
router.put('/:id', authenticate, requireManager, validate(updateDailyChallengeSchema), updateDailyChallenge);
router.delete('/:id', authenticate, requireManager, validate(dailyChallengeParamsSchema), deleteDailyChallenge);

export default router;
