import { Router } from 'express';
import {
  getAdminDashboard,
  getAdminReports,
  getPlatformSettings,
  updatePlatformSettings,
} from '../controllers/admin.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateSettingsSchema, adminReportQuerySchema } from '../validators/admin.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin Dashboard, Reports and Platform Settings
 */

router.get('/dashboard', authenticate, requireAdmin, getAdminDashboard);
router.get('/reports', authenticate, requireAdmin, validate(adminReportQuerySchema), getAdminReports);
router.get('/settings', authenticate, requireAdmin, getPlatformSettings);
router.put('/settings', authenticate, requireAdmin, validate(updateSettingsSchema), updatePlatformSettings);

export default router;
