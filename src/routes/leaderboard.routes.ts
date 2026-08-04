/**
 * FPRD-20: Leaderboard Route
 * GET /api/leaderboard — XP-based ranking
 */

import { Router } from 'express';
import { getLeaderboard } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get XP-based leaderboard for all students
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Leaderboard fetched successfully
 */
router.get('/', authenticate, requireStudent, getLeaderboard);

export default router;
