import { Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { sendSuccess } from '../utils/response';
import { PLACEMENT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin Dashboard, Reports and Platform Settings
 */

// Stats
export const getAdminStats = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await adminService.getStats();
    sendSuccess(res, 'Stats fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

// Users
export const getAdminUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { search, role, page, limit } = req.query as {
      search?: string;
      role?: string;
      page?: string;
      limit?: string;
    };
    const data = await adminService.getUsers({
      search,
      role,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    sendSuccess(res, 'Users fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const data = await adminService.updateUserRole(id, role);
    sendSuccess(res, 'User role updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    await adminService.deleteUser(id);
    sendSuccess(res, 'User deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

// Reports
export const getReports = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const data = await adminService.getReports({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    sendSuccess(res, 'Reports fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

export const generateReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { type } = req.body;
    const data = await adminService.generateReport(type, req.user!.userId);
    sendSuccess(res, 'Report generated successfully', data);
  } catch (error) {
    next(error);
  }
};

// Generic Resource
export const getAdminResource = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { resource } = req.params;
    const { search, page, limit } = req.query as { search?: string; page?: string; limit?: string };
    const data = await adminService.getResource(resource, {
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    sendSuccess(res, `${resource} fetched successfully`, data);
  } catch (error) {
    next(error);
  }
};

export const createAdminResource = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { resource } = req.params;
    const data = await adminService.createResource(resource, req.body);
    sendSuccess(res, `${resource} created successfully`, data);
  } catch (error) {
    next(error);
  }
};

export const updateAdminResource = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { resource, id } = req.params;
    const data = await adminService.updateResource(resource, id, req.body);
    sendSuccess(res, `${resource} updated successfully`, data);
  } catch (error) {
    next(error);
  }
};

export const deleteAdminResource = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { resource, id } = req.params;
    await adminService.deleteResource(resource, id);
    sendSuccess(res, `${resource} deleted successfully`, null);
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteAdminResource = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { resource } = req.params;
    const { ids } = req.body;
    await adminService.bulkDeleteResource(resource, ids);
    sendSuccess(res, `${resource} deleted successfully`, null);
  } catch (error) {
    next(error);
  }
};

// Backward compatibility
export const getAdminDashboard = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await adminService.getDashboard();
    sendSuccess(res, PLACEMENT_MESSAGES.ADMIN_DASHBOARD_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

export const getAdminReports = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const data = await adminService.getReportsLegacy(startDate, endDate);
    sendSuccess(res, PLACEMENT_MESSAGES.ADMIN_REPORTS_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

export const getPlatformSettings = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const settings = await adminService.getSettings();
    sendSuccess(res, PLACEMENT_MESSAGES.SETTINGS_FETCHED, settings);
  } catch (error) {
    next(error);
  }
};

export const updatePlatformSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const settings = await adminService.updateSettings(req.body);
    sendSuccess(res, PLACEMENT_MESSAGES.SETTINGS_UPDATED, settings);
  } catch (error) {
    next(error);
  }
};
