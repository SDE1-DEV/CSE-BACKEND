/**
 * PRD-07: Super Admin Controller
 */

import { Response, NextFunction } from 'express';
import { superAdminService } from '../../services/admin/super-admin.service';
import { sendSuccess, sendCreated } from '../../utils/response';
import { ROLE_MESSAGES } from '../../constants';
import { AuthenticatedRequest } from '../../types';

// ── Dashboard ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get Super Admin dashboard
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
export const getSuperAdminDashboard = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await superAdminService.getDashboard();
    sendSuccess(res, ROLE_MESSAGES.SUPER_ADMIN_DASHBOARD_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

// ── User Management ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users (paginated)
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { search, role, page, limit } = req.query as Record<string, string>;
    const data = await superAdminService.getUsers({
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

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get a single user with role history and permissions
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await superAdminService.getUserById(req.params['id']);
    sendSuccess(res, 'User fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/users/{id}:
 *   patch:
 *     summary: Update a user (name, verification)
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await superAdminService.updateUser(req.params['id'], req.body);
    sendSuccess(res, 'User updated successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await superAdminService.deleteUser(req.params['id'], req.user!.userId);
    sendSuccess(res, 'User deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Update user verification status
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const updateUserStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { isVerified } = req.body;
    const data = await superAdminService.updateUserStatus(
      req.params['id'],
      Boolean(isVerified),
      req.user!.userId,
    );
    sendSuccess(res, ROLE_MESSAGES.USER_STATUS_UPDATED, data);
  } catch (error) {
    next(error);
  }
};

// ── Promote / Demote ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/users/{id}/promote:
 *   post:
 *     summary: Promote a student to Manager
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const promoteUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { reason, modules } = req.body;
    const data = await superAdminService.promoteUser(
      req.params['id'],
      req.user!.userId,
      reason,
      modules,
    );
    sendSuccess(res, ROLE_MESSAGES.USER_PROMOTED, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/users/{id}/demote:
 *   post:
 *     summary: Demote a Manager back to Student
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const demoteUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { reason } = req.body;
    const data = await superAdminService.demoteUser(
      req.params['id'],
      req.user!.userId,
      reason,
    );
    sendSuccess(res, ROLE_MESSAGES.USER_DEMOTED, data);
  } catch (error) {
    next(error);
  }
};

// ── Manager Permissions ────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/managers:
 *   get:
 *     summary: List all managers with permissions
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const getManagers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page, limit } = req.query as Record<string, string>;
    const data = await superAdminService.getManagers({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    sendSuccess(res, 'Managers fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/managers/{id}:
 *   get:
 *     summary: Get a single manager with permissions
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const getManagerById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await superAdminService.getManagerById(req.params['id']);
    sendSuccess(res, 'Manager fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/managers/{id}/permissions:
 *   put:
 *     summary: Update a manager's module permissions
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             learning: true
 *             coding: true
 *             projects: false
 *             placements: true
 *             events: false
 *             notifications: true
 */
export const updateManagerPermissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await superAdminService.updateManagerPermissions(
      req.params['id'],
      req.body,
      req.user!.userId,
    );
    sendSuccess(res, ROLE_MESSAGES.PERMISSION_UPDATED, data);
  } catch (error) {
    next(error);
  }
};

// ── Analytics ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     summary: Get platform-wide analytics
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const getPlatformAnalytics = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await superAdminService.getPlatformAnalytics();
    sendSuccess(res, ROLE_MESSAGES.PLATFORM_ANALYTICS_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

// ── Platform Settings ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Get platform settings
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const getPlatformSettings = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await superAdminService.getSettings();
    sendSuccess(res, 'Settings fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/settings:
 *   put:
 *     summary: Update platform settings
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const updatePlatformSettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await superAdminService.updateSettings(req.body, req.user!.userId);
    sendSuccess(res, 'Settings updated successfully', data);
  } catch (error) {
    next(error);
  }
};

// ── Audit Logs ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/audit:
 *   get:
 *     summary: Get audit logs with filters
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const getAuditLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { role, action, module, userId, startDate, endDate, page, limit } =
      req.query as Record<string, string>;
    const data = await superAdminService.getAuditLogs({
      role,
      action,
      module,
      userId,
      startDate,
      endDate,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    sendSuccess(res, ROLE_MESSAGES.AUDIT_LOGS_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

// ── Reports ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: Get platform reports
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const getReports = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const data = await superAdminService.getReports({ startDate, endDate });
    sendSuccess(res, ROLE_MESSAGES.REPORTS_EXPORTED, data);
  } catch (error) {
    next(error);
  }
};

// ── Daily Metric Snapshot ──────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/metrics/snapshot:
 *   post:
 *     summary: Trigger a daily platform metric snapshot
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 */
export const createMetricSnapshot = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await superAdminService.createDailySnapshot();
    sendCreated(res, ROLE_MESSAGES.METRIC_SNAPSHOT_CREATED, data);
  } catch (error) {
    next(error);
  }
};

// ── System Logs ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/system-logs:
 *   get:
 *     summary: Get system logs with filters
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [info, warn, error, debug]
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: System logs list
 */
export const getSystemLogs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { level, module, startDate, endDate, page, limit } =
      req.query as Record<string, string>;
    const data = await superAdminService.getSystemLogs({
      level,
      module,
      startDate,
      endDate,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    sendSuccess(res, ROLE_MESSAGES.SYSTEM_LOGS_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

// ── Manager Invitations ────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/invitations:
 *   post:
 *     summary: Send a manager invitation to an email address
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Invitation sent
 */
export const sendManagerInvitation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body as { email: string };
    const data = await superAdminService.sendManagerInvitation(email, req.user!.userId);
    sendCreated(res, ROLE_MESSAGES.INVITATION_SENT, data);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /admin/invitations/{token}/accept:
 *   post:
 *     summary: Accept a manager invitation (user must be logged in)
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation accepted, user promoted to Manager
 */
export const acceptManagerInvitation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token } = req.params;
    const data = await superAdminService.acceptManagerInvitation(
      token,
      req.user!.userId,
      req.user!.email,
    );
    sendSuccess(res, ROLE_MESSAGES.INVITATION_ACCEPTED, data);
  } catch (error) {
    next(error);
  }
};

// ── Role History ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/users/{id}/role-history:
 *   get:
 *     summary: Get role change history for a specific user
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Role history list
 */
export const getUserRoleHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await superAdminService.getUserRoleHistory(req.params['id']);
    sendSuccess(res, ROLE_MESSAGES.ROLE_HISTORY_FETCHED, data);
  } catch (error) {
    next(error);
  }
};
