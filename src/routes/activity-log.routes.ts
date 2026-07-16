import { Router } from 'express';
import { getTeamActivity } from '../controllers/activity-log.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';

const router = Router();

// GET /api/teams/:id/activity  — mounted inside team routes as /:id/activity
// But since this is mounted separately, we use /:id/activity via the parent router
router.get('/:id/activity', authenticate, requireStudent, getTeamActivity);

export default router;
