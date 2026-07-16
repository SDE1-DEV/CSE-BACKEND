import { Response, NextFunction } from 'express';
import { projectDashboardService } from '../services/project-dashboard.service';
import { sendSuccess } from '../utils/response';
import { PROJECT_MESSAGES, HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';

/**
 * @swagger
 * tags:
 *   name: Project Dashboard
 *   description: Aggregated project dashboard data
 */

/**
 * @swagger
 * /api/dashboard/projects:
 *   get:
 *     tags: [Project Dashboard]
 *     summary: Get project dashboard (active teams, tasks, deadlines, activity, invitations)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectDashboardResponse'
 */
export const getProjectDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const data = await projectDashboardService.getDashboard(req.user.userId);
    sendSuccess(res, PROJECT_MESSAGES.DASHBOARD_FETCHED, data);
  } catch (error) {
    next(error);
  }
};
