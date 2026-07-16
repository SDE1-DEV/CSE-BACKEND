import { Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { sendSuccess } from '../utils/response';
import { PLACEMENT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { UpdateSettingsInput } from '../validators/admin.validator';

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin Dashboard, Reports and Platform Settings
 */

export const getAdminDashboard = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.getDashboard();
    sendSuccess(res, PLACEMENT_MESSAGES.ADMIN_DASHBOARD_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

export const getAdminReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const data = await adminService.getReports(startDate, endDate);
    sendSuccess(res, PLACEMENT_MESSAGES.ADMIN_REPORTS_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

export const getPlatformSettings = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await adminService.getSettings();
    sendSuccess(res, PLACEMENT_MESSAGES.SETTINGS_FETCHED, settings);
  } catch (error) {
    next(error);
  }
};

export const updatePlatformSettings = async (
  req: AuthenticatedRequest & { body: UpdateSettingsInput },
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const settings = await adminService.updateSettings(req.body.settings);
    sendSuccess(res, PLACEMENT_MESSAGES.SETTINGS_UPDATED, settings);
  } catch (error) {
    next(error);
  }
};
