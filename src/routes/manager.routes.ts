/**
 * PRD-07: Manager Routes
 * Protected by authenticate + requireManager + per-module requirePermission
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
import { requirePermission, requirePublishPermission } from '../middlewares/permission.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  getManagerDashboard,

  // Learning
  createCategory,
  updateCategory,
  deleteCategory,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  publishRoadmap,
  archiveRoadmap,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
  createResource,
  updateResource,
  deleteResource,

  // Coding
  createProblem,
  updateProblem,
  deleteProblem,
  publishProblem,
  archiveProblem,

  // Projects
  createProject,
  updateProject,
  deleteProject,

  // Placements
  createCompany,
  updateCompany,
  deleteCompany,
  createJob,
  updateJob,
  deleteJob,

  // Events
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,

  // Notifications
  createNotification,
  broadcastNotification,
  updateNotification,
  deleteNotification,

  // Reports
  getManagerReports,

  // Bulk
  bulkPublish,
  bulkArchive,
  bulkDelete,
} from '../controllers/manager/manager.controller';
import {
  createNotificationSchema,
  broadcastNotificationSchema,
  bulkActionSchema,
} from '../validators/role-management.validator';

const router = Router();

// All manager routes require authentication
router.use(authenticate, requireManager);

/**
 * @swagger
 * tags:
 *   name: Manager
 *   description: Manager content management console (MANAGER or SUPER_ADMIN role)
 */

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', getManagerDashboard);

// ── Learning ──────────────────────────────────────────────────────────────────
router.post('/learning/categories', requirePermission('LEARNING'), createCategory);
router.patch('/learning/categories/:id', requirePermission('LEARNING'), updateCategory);
router.delete('/learning/categories/:id', requirePermission('LEARNING'), deleteCategory);

router.post('/learning/roadmaps', requirePermission('LEARNING'), createRoadmap);
router.patch('/learning/roadmaps/:id', requirePermission('LEARNING'), updateRoadmap);
router.delete('/learning/roadmaps/:id', requirePermission('LEARNING'), deleteRoadmap);
router.patch('/learning/roadmaps/:id/publish', requirePublishPermission('LEARNING'), publishRoadmap);
router.patch('/learning/roadmaps/:id/archive', requirePublishPermission('LEARNING'), archiveRoadmap);

router.post('/learning/sections', requirePermission('LEARNING'), createSection);
router.patch('/learning/sections/:id', requirePermission('LEARNING'), updateSection);
router.delete('/learning/sections/:id', requirePermission('LEARNING'), deleteSection);

router.post('/learning/lessons', requirePermission('LEARNING'), createLesson);
router.patch('/learning/lessons/:id', requirePermission('LEARNING'), updateLesson);
router.delete('/learning/lessons/:id', requirePermission('LEARNING'), deleteLesson);

router.post('/learning/resources', requirePermission('LEARNING'), createResource);
router.patch('/learning/resources/:id', requirePermission('LEARNING'), updateResource);
router.delete('/learning/resources/:id', requirePermission('LEARNING'), deleteResource);

// ── Coding ────────────────────────────────────────────────────────────────────
router.post('/problems', requirePermission('CODING'), createProblem);
router.put('/problems/:id', requirePermission('CODING'), updateProblem);
router.delete('/problems/:id', requirePermission('CODING'), deleteProblem);
router.patch('/problems/:id/publish', requirePublishPermission('CODING'), publishProblem);
router.patch('/problems/:id/archive', requirePublishPermission('CODING'), archiveProblem);

// ── Projects ──────────────────────────────────────────────────────────────────
router.post('/projects', requirePermission('PROJECTS'), createProject);
router.put('/projects/:id', requirePermission('PROJECTS'), updateProject);
router.delete('/projects/:id', requirePermission('PROJECTS'), deleteProject);

// ── Placements ────────────────────────────────────────────────────────────────
router.post('/placements/companies', requirePermission('PLACEMENTS'), createCompany);
router.put('/placements/companies/:id', requirePermission('PLACEMENTS'), updateCompany);
router.delete('/placements/companies/:id', requirePermission('PLACEMENTS'), deleteCompany);

router.post('/placements/jobs', requirePermission('PLACEMENTS'), createJob);
router.put('/placements/jobs/:id', requirePermission('PLACEMENTS'), updateJob);
router.delete('/placements/jobs/:id', requirePermission('PLACEMENTS'), deleteJob);

// ── Events ────────────────────────────────────────────────────────────────────
router.post('/events', requirePermission('EVENTS'), createEvent);
router.put('/events/:id', requirePermission('EVENTS'), updateEvent);
router.delete('/events/:id', requirePermission('EVENTS'), deleteEvent);
router.get('/events/:id/registrations', requirePermission('EVENTS'), getEventRegistrations);

// ── Notifications ──────────────────────────────────────────────────────────────
router.post(
  '/notifications',
  requirePermission('NOTIFICATIONS'),
  validate(createNotificationSchema),
  createNotification,
);
router.post(
  '/notifications/broadcast',
  requirePermission('NOTIFICATIONS'),
  validate(broadcastNotificationSchema),
  broadcastNotification,
);
router.put('/notifications/:id', requirePermission('NOTIFICATIONS'), updateNotification);
router.delete('/notifications/:id', requirePermission('NOTIFICATIONS'), deleteNotification);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports', requirePermission('REPORTS'), getManagerReports);

// ── Bulk Actions ──────────────────────────────────────────────────────────────
router.post('/content/bulk-publish', validate(bulkActionSchema), bulkPublish);
router.post('/content/bulk-archive', validate(bulkActionSchema), bulkArchive);
router.post('/content/bulk-delete', validate(bulkActionSchema), bulkDelete);

export default router;
