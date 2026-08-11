/**
 * FPRD-20: Dashboard Routes
 * GET /api/dashboard            — aggregated dashboard (PRD-FINAL-01 §36-37)
 * GET /api/dashboard/daily-tasks
 * GET /api/dashboard/activity
 */

import { Router } from 'express';
import { getDailyTasks, getDashboardActivity, getAggregatedDashboard } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';

const router = Router();

/**
 * PRD-FINAL-01 §36-37: Single aggregated endpoint.
 * Returns user summary, learning summary, continue-learning, daily tasks,
 * coding analytics and leaderboard summary in one request.
 * Existing individual endpoints remain available for direct navigation.
 */
router.get('/', authenticate, requireStudent, getAggregatedDashboard);

/**
 * @swagger
 * /api/dashboard/daily-tasks:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get today's lesson and coding challenge for the logged-in student
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Daily tasks fetched successfully
 */
router.get('/daily-tasks', authenticate, requireStudent, getDailyTasks);

/**
 * @swagger
 * /api/dashboard/activity:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get GitHub-style activity heatmap data for the logged-in student
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         description: Year to fetch activity for (defaults to current year)
 *     responses:
 *       200:
 *         description: Activity data fetched successfully
 */
router.get('/activity', authenticate, requireStudent, getDashboardActivity);

export default router;
