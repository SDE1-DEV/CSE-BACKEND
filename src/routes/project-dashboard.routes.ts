import { Router } from 'express';
import { getProjectDashboard } from '../controllers/project-dashboard.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';

const router = Router();

router.get('/projects', authenticate, requireStudent, getProjectDashboard);

export default router;
