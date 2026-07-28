import { Router } from 'express';
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getReports,
  generateReport,
  getAdminResource,
  createAdminResource,
  updateAdminResource,
  deleteAdminResource,
  bulkDeleteAdminResource,
  getAdminDashboard,
  getAdminReports,
  getPlatformSettings,
  updatePlatformSettings,
} from '../controllers/admin.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireSuperAdmin } from '../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin Dashboard, Reports and Platform Settings
 */

// Stats
router.get('/stats', authenticate, requireSuperAdmin, getAdminStats);

// Users
router.get('/users', authenticate, requireSuperAdmin, getAdminUsers);
router.patch('/users/:id/role', authenticate, requireSuperAdmin, updateUserRole);
router.delete('/users/:id', authenticate, requireSuperAdmin, deleteUser);

// Reports
router.get('/reports', authenticate, requireSuperAdmin, getReports);
router.post('/reports', authenticate, requireSuperAdmin, generateReport);

// Generic resource management
router.get('/:resource', authenticate, requireSuperAdmin, getAdminResource);
router.post('/:resource', authenticate, requireSuperAdmin, createAdminResource);
router.put('/:resource/:id', authenticate, requireSuperAdmin, updateAdminResource);
router.delete('/:resource/:id', authenticate, requireSuperAdmin, deleteAdminResource);
router.post('/:resource/bulk-delete', authenticate, requireSuperAdmin, bulkDeleteAdminResource);

// Backward compatibility
router.get('/dashboard', authenticate, requireSuperAdmin, getAdminDashboard);
router.get('/settings', authenticate, requireSuperAdmin, getPlatformSettings);
router.put('/settings', authenticate, requireSuperAdmin, updatePlatformSettings);

export default router;
