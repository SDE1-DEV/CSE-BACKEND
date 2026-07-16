import { Request, Response, NextFunction } from 'express';
import { activityLogService } from '../services/activity-log.service';
import { sendSuccess } from '../utils/response';
import { PROJECT_MESSAGES, HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';

/**
 * @swagger
 * tags:
 *   name: Activity
 *   description: Team activity timeline
 */

/**
 * @swagger
 * /api/teams/{id}/activity:
 *   get:
 *     tags: [Activity]
 *     summary: Get team activity timeline (descending order)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Activity log fetched
 */
export const getTeamActivity = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await activityLogService.getTeamActivity(
      req.params.id,
      req.user.userId,
      page,
      limit,
    );
    sendSuccess(res, PROJECT_MESSAGES.ACTIVITY_FETCHED, result);
  } catch (error) {
    next(error);
  }
};
