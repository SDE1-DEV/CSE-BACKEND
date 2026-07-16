import { Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { sendSuccess } from '../utils/response';
import { PLACEMENT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: User Analytics Dashboard
 */

export const getAnalyticsDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await analyticsService.getDashboard(req.user!.userId);
    sendSuccess(res, PLACEMENT_MESSAGES.ANALYTICS_FETCHED, data);
  } catch (error) {
    next(error);
  }
};
