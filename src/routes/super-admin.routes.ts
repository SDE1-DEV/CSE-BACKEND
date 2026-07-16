/**
 * PRD-07: Super Admin Routes
 * All routes are protected by authenticate + requireSuperAdmin
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireSuperAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  getSuperAdminDashboard,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  promoteUser,
  demoteUser,
  getManagers,
  getManagerById,
  updateManagerPermissions,
  getPlatformAnalytics,
  getPlatformSettings,
  updatePlatformSettings,
  getAuditLogs,
  getReports,
  createMetricSnapshot,
  getSystemLogs,
  sendManagerInvitation,
  acceptManagerInvitation,
  getUserRoleHistory,
} from '../controllers/admin/super-admin.controller';
import {
  promoteUserSchema,
  demoteUserSchema,
  updatePermissionsSchema,
  updateUserStatusSchema,
  sendInvitationSchema,
} from '../validators/role-management.validator';
import { updateSettingsSchema } from '../validators/admin.validator';

const router = Router();

// Apply authentication + super admin guard to all routes
router.use(authenticate, requireSuperAdmin);

/**
 * @swagger
 * tags:
 *   name: Super Admin
 *   description: Super Admin platform management (SUPER_ADMIN role only)
 */

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', getSuperAdminDashboard);

// ── User Management ───────────────────────────────────────────────────────────
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/status', validate(updateUserStatusSchema), updateUserStatus);

// ── Promote / Demote ──────────────────────────────────────────────────────────
router.post('/users/:id/promote', validate(promoteUserSchema), promoteUser);
router.post('/users/:id/demote', validate(demoteUserSchema), demoteUser);

// ── Manager Management ────────────────────────────────────────────────────────
router.get('/managers', getManagers);
router.get('/managers/:id', getManagerById);
router.put('/managers/:id/permissions', validate(updatePermissionsSchema), updateManagerPermissions);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', getPlatformAnalytics);

// ── Settings ──────────────────────────────────────────────────────────────────
router.get('/settings', getPlatformSettings);
router.put('/settings', validate(updateSettingsSchema), updatePlatformSettings);

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get('/audit', getAuditLogs);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports', getReports);

// ── Metrics ───────────────────────────────────────────────────────────────────
router.post('/metrics/snapshot', createMetricSnapshot);

// ── System Logs ───────────────────────────────────────────────────────────────
router.get('/system-logs', getSystemLogs);

// ── Manager Invitations ───────────────────────────────────────────────────────
router.post('/invitations', validate(sendInvitationSchema), sendManagerInvitation);
router.post('/invitations/:token/accept', acceptManagerInvitation);

// ── Role History ──────────────────────────────────────────────────────────────
router.get('/users/:id/role-history', getUserRoleHistory);

export default router;
