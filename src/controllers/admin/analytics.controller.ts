/**
 * FPRD-09: Enterprise Analytics Controller
 */

import { Response, NextFunction } from 'express';
import { analyticsService } from '../../services/admin/analytics.service';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

export const getDashboardOverview = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await analyticsService.getDashboardOverview();
    sendSuccess(res, 'Dashboard overview fetched', data);
  } catch (error) {
    next(error);
  }
};

export const getUserAnalytics = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await analyticsService.getUserAnalytics();
    sendSuccess(res, 'User analytics fetched', data);
  } catch (error) {
    next(error);
  }
};

export const getChartsData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { period } = req.query as { period?: 'daily' | 'weekly' | 'monthly' | 'yearly' };
    const data = await analyticsService.getChartsData(period ?? 'monthly');
    sendSuccess(res, 'Chart data fetched', data);
  } catch (error) {
    next(error);
  }
};

export const getUsageAnalytics = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await analyticsService.getUsageAnalytics();
    sendSuccess(res, 'Usage analytics fetched', data);
  } catch (error) {
    next(error);
  }
};

export const getApiAnalytics = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await analyticsService.getApiAnalytics();
    sendSuccess(res, 'API analytics fetched', data);
  } catch (error) {
    next(error);
  }
};

export const getDatabaseAnalytics = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await analyticsService.getDatabaseAnalytics();
    sendSuccess(res, 'Database analytics fetched', data);
  } catch (error) {
    next(error);
  }
};

export const getSystemHealth = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await analyticsService.getSystemHealth();
    sendSuccess(res, 'System health fetched', data);
  } catch (error) {
    next(error);
  }
};

export const getManagerAnalytics = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await analyticsService.getManagerAnalytics();
    sendSuccess(res, 'Manager analytics fetched', data);
  } catch (error) {
    next(error);
  }
};

export const getLiveActivity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 30;
    const data = await analyticsService.getLiveActivity(limit);
    sendSuccess(res, 'Live activity fetched', data);
  } catch (error) {
    next(error);
  }
};
