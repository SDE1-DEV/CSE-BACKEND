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
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin Dashboard, Reports and Platform Settings
 */

// Stats
router.get('/stats', authenticate, requireAdmin, getAdminStats);

// Users
router.get('/users', authenticate, requireAdmin, getAdminUsers);
router.patch('/users/:id/role', authenticate, requireAdmin, updateUserRole);
router.delete('/users/:id', authenticate, requireAdmin, deleteUser);

// Reports
router.get('/reports', authenticate, requireAdmin, getReports);
router.post('/reports', authenticate, requireAdmin, generateReport);

// Generic resource management
router.get('/:resource', authenticate, requireAdmin, getAdminResource);
router.post('/:resource', authenticate, requireAdmin, createAdminResource);
router.put('/:resource/:id', authenticate, requireAdmin, updateAdminResource);
router.delete('/:resource/:id', authenticate, requireAdmin, deleteAdminResource);
router.post('/:resource/bulk-delete', authenticate, requireAdmin, bulkDeleteAdminResource);

// Backward compatibility
router.get('/dashboard', authenticate, requireAdmin, getAdminDashboard);
router.get('/settings', authenticate, requireAdmin, getPlatformSettings);
router.put('/settings', authenticate, requireAdmin, updatePlatformSettings);

export default router;
