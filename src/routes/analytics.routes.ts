import { Router } from 'express';
import { getAnalyticsDashboard } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: User Analytics Dashboard
 */

router.get('/dashboard', authenticate, requireStudent, getAnalyticsDashboard);

export default router;
