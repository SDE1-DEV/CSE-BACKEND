/**
 * FPRD-10: Manager CMS Routes
 * Protected by authenticate + requireManager + per-module requirePermission
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
import { requirePermission, requirePublishPermission } from '../middlewares/permission.middleware';
import { validate, validateAndSanitize } from '../middlewares/validate.middleware';
import { uploadMedia } from '../middlewares/upload.middleware';
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getFaqCategories,
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  createFaqCategory,
  updateFaqCategory,
  deleteFaqCategory,
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getMediaFiles,
  createMediaFile,
  uploadMediaFile,
  updateMediaFile,
  deleteMediaFile,
  getMediaFolders,
  getVersionHistory,
  restoreVersion,
  globalCMSSearch,
} from '../controllers/manager/cms-extras.controller';

import {
  getManagerDashboard,
  getManagerCMSDashboard,

  // Learning — GET
  getCategories,
  getRoadmaps,
  getRoadmapById,
  getSections,
  getLessons,
  getLessonById,
  getResources,

  // Learning — CREATE/UPDATE/DELETE
  createCategory,
  updateCategory,
  deleteCategory,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  publishRoadmap,
  archiveRoadmap,
  duplicateRoadmap,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
  createResource,
  updateResource,
  deleteResource,

  // Coding — GET
  getProblems,
  getProblemById,
  getProblemCategories,

  // Coding — CREATE/UPDATE/DELETE
  createProblem,
  updateProblem,
  deleteProblem,
  publishProblem,
  archiveProblem,
  duplicateProblem,
  createProblemCategory,
  updateProblemCategory,
  deleteProblemCategory,

  // Projects — GET
  getProjects,
  getProjectById,
  getProjectCategories,

  // Projects — CREATE/UPDATE/DELETE
  createProject,
  updateProject,
  deleteProject,
  publishProject,
  archiveProject,
  createProjectCategory,
  updateProjectCategory,
  deleteProjectCategory,
  // Placements — GET
  getCompanies,
  getJobs,
  getJobById,

  // Placements — CREATE/UPDATE/DELETE
  createCompany,
  updateCompany,
  deleteCompany,
  createJob,
  updateJob,
  deleteJob,
  publishJob,

  // Events — GET
  getEvents,
  getEventById,

  // Events — CREATE/UPDATE/DELETE
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
  publishEvent,
  archiveEvent,

  // Notifications — GET
  getNotifications,

  // Notifications — CREATE/UPDATE/DELETE
  createNotification,
  broadcastNotification,
  updateNotification,
  deleteNotification,

  // Reports
  getManagerReports,

  // Activity Log
  getActivityLog,

  // Bulk
  bulkPublish,
  bulkArchive,
  bulkDelete,
  bulkRestore,
  getTrash,

  // Export
  exportContent,
  importContent,
} from '../controllers/manager/manager.controller';
import {
  createNotificationSchema,
  broadcastNotificationSchema,
  bulkActionSchema,
} from '../validators/role-management.validator';
import {
  createCategorySchema,
  updateCategorySchema,
  createRoadmapSchema,
  updateRoadmapSchema,
  createSectionSchema,
  updateSectionSchema,
  createLessonSchema,
  updateLessonSchema,
  createResourceSchema,
  updateResourceSchema,
  createProblemCategorySchema,
  updateProblemCategorySchema,
  createProblemSchema,
  updateProblemSchema,
  createProjectCategorySchema,
  updateProjectCategorySchema,
  createProjectSchema,
  updateProjectSchema,
  createCompanySchema,
  updateCompanySchema,
  createJobSchema,
  updateJobSchema,
  createEventSchema,
  updateEventSchema,
  createBannerSchema,
  updateBannerSchema,
  createFaqCategorySchema,
  updateFaqCategorySchema,
  createFaqSchema,
  updateFaqSchema,
  createTestimonialSchema,
  updateTestimonialSchema,
  createMediaFileSchema,
  updateMediaFileSchema,
  updateNotificationSchema,
} from '../validators/manager-cms.validator';
import { z } from 'zod';

const idOnlySchema = (key: 'id' | 'versionId' | 'entityId') =>
  z.object({
    params: z.object({
      [key]: z.string({ required_error: `${key} is required` }).uuid(`Invalid ${key} format`),
    }),
  });

const router = Router();

// All manager routes require authentication
router.use(authenticate, requireManager);

/**
 * @swagger
 * tags:
 *   name: Manager
 *   description: FPRD-10 Enterprise CMS — Manager content management (MANAGER or SUPER_ADMIN role)
 */

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', getManagerDashboard);
router.get('/cms/dashboard', getManagerCMSDashboard);

// ── Learning: Categories ──────────────────────────────────────────────────────
router.get('/categories', requirePermission('LEARNING', 'read'), getCategories);
router.post(
  '/categories',
  requirePermission('LEARNING'),
  validateAndSanitize(createCategorySchema),
  createCategory,
);
router.patch(
  '/categories/:id',
  requirePermission('LEARNING'),
  validateAndSanitize(updateCategorySchema),
  updateCategory,
);
router.delete(
  '/categories/:id',
  requirePermission('LEARNING'),
  validate(idOnlySchema('id')),
  deleteCategory,
);

// ── Learning: Roadmaps ────────────────────────────────────────────────────────
router.get('/roadmaps', requirePermission('LEARNING', 'read'), getRoadmaps);
router.get(
  '/roadmaps/:id',
  requirePermission('LEARNING', 'read'),
  validate(idOnlySchema('id')),
  getRoadmapById,
);
router.post(
  '/roadmaps',
  requirePermission('LEARNING'),
  validateAndSanitize(createRoadmapSchema),
  createRoadmap,
);
router.patch(
  '/roadmaps/:id',
  requirePermission('LEARNING'),
  validateAndSanitize(updateRoadmapSchema),
  updateRoadmap,
);
router.delete(
  '/roadmaps/:id',
  requirePermission('LEARNING'),
  validate(idOnlySchema('id')),
  deleteRoadmap,
);
router.patch(
  '/roadmaps/:id/publish',
  requirePublishPermission('LEARNING'),
  validate(idOnlySchema('id')),
  publishRoadmap,
);
router.patch(
  '/roadmaps/:id/archive',
  requirePublishPermission('LEARNING'),
  validate(idOnlySchema('id')),
  archiveRoadmap,
);
router.post(
  '/roadmaps/:id/duplicate',
  requirePermission('LEARNING'),
  validate(idOnlySchema('id')),
  duplicateRoadmap,
);

// ── Learning: Sections ────────────────────────────────────────────────────────
router.get('/roadmaps/:roadmapId/sections', requirePermission('LEARNING', 'read'), getSections);
router.post(
  '/sections',
  requirePermission('LEARNING'),
  validateAndSanitize(createSectionSchema),
  createSection,
);
router.patch(
  '/sections/:id',
  requirePermission('LEARNING'),
  validateAndSanitize(updateSectionSchema),
  updateSection,
);
router.delete(
  '/sections/:id',
  requirePermission('LEARNING'),
  validate(idOnlySchema('id')),
  deleteSection,
);

// ── Learning: Lessons ─────────────────────────────────────────────────────────
router.get('/lessons', requirePermission('LEARNING', 'read'), getLessons);
router.get(
  '/lessons/:id',
  requirePermission('LEARNING', 'read'),
  validate(idOnlySchema('id')),
  getLessonById,
);
router.post(
  '/lessons',
  requirePermission('LEARNING'),
  validateAndSanitize(createLessonSchema),
  createLesson,
);
router.patch(
  '/lessons/:id',
  requirePermission('LEARNING'),
  validateAndSanitize(updateLessonSchema),
  updateLesson,
);
router.delete(
  '/lessons/:id',
  requirePermission('LEARNING'),
  validate(idOnlySchema('id')),
  deleteLesson,
);

// ── Learning: Resources ───────────────────────────────────────────────────────
router.get('/resources', requirePermission('LEARNING', 'read'), getResources);
router.post(
  '/resources',
  requirePermission('LEARNING'),
  validateAndSanitize(createResourceSchema),
  createResource,
);
router.patch(
  '/resources/:id',
  requirePermission('LEARNING'),
  validateAndSanitize(updateResourceSchema),
  updateResource,
);
router.delete(
  '/resources/:id',
  requirePermission('LEARNING'),
  validate(idOnlySchema('id')),
  deleteResource,
);

// ── Coding: Problem Categories ────────────────────────────────────────────────
router.get('/problem-categories', requirePermission('CODING', 'read'), getProblemCategories);
router.post(
  '/problem-categories',
  requirePermission('CODING'),
  validateAndSanitize(createProblemCategorySchema),
  createProblemCategory,
);
router.patch(
  '/problem-categories/:id',
  requirePermission('CODING'),
  validateAndSanitize(updateProblemCategorySchema),
  updateProblemCategory,
);
router.delete(
  '/problem-categories/:id',
  requirePermission('CODING'),
  validate(idOnlySchema('id')),
  deleteProblemCategory,
);

// ── Coding: Problems ──────────────────────────────────────────────────────────
router.get('/problems', requirePermission('CODING', 'read'), getProblems);
router.get(
  '/problems/:id',
  requirePermission('CODING', 'read'),
  validate(idOnlySchema('id')),
  getProblemById,
);
router.post(
  '/problems',
  requirePermission('CODING'),
  validateAndSanitize(createProblemSchema),
  createProblem,
);
router.put(
  '/problems/:id',
  requirePermission('CODING'),
  validateAndSanitize(updateProblemSchema),
  updateProblem,
);
router.delete(
  '/problems/:id',
  requirePermission('CODING'),
  validate(idOnlySchema('id')),
  deleteProblem,
);
router.patch(
  '/problems/:id/publish',
  requirePublishPermission('CODING'),
  validate(idOnlySchema('id')),
  publishProblem,
);
router.patch(
  '/problems/:id/archive',
  requirePublishPermission('CODING'),
  validate(idOnlySchema('id')),
  archiveProblem,
);
router.post(
  '/problems/:id/duplicate',
  requirePermission('CODING'),
  validate(idOnlySchema('id')),
  duplicateProblem,
);

// ── Projects: Categories ──────────────────────────────────────────────────────
router.get('/project-categories', requirePermission('PROJECTS', 'read'), getProjectCategories);
router.post(
  '/project-categories',
  requirePermission('PROJECTS'),
  validateAndSanitize(createProjectCategorySchema),
  createProjectCategory,
);
router.patch(
  '/project-categories/:id',
  requirePermission('PROJECTS'),
  validateAndSanitize(updateProjectCategorySchema),
  updateProjectCategory,
);
router.delete('/project-categories/:id', requirePermission('PROJECTS'), deleteProjectCategory);

// ── Projects ──────────────────────────────────────────────────────────────────
router.get('/projects', requirePermission('PROJECTS', 'read'), getProjects);
router.get(
  '/projects/:id',
  requirePermission('PROJECTS', 'read'),
  validate(idOnlySchema('id')),
  getProjectById,
);
router.post(
  '/projects',
  requirePermission('PROJECTS'),
  validateAndSanitize(createProjectSchema),
  createProject,
);
router.put(
  '/projects/:id',
  requirePermission('PROJECTS'),
  validateAndSanitize(updateProjectSchema),
  updateProject,
);
router.delete(
  '/projects/:id',
  requirePermission('PROJECTS'),
  validate(idOnlySchema('id')),
  deleteProject,
);
router.patch(
  '/projects/:id/publish',
  requirePublishPermission('PROJECTS'),
  validate(idOnlySchema('id')),
  publishProject,
);
router.patch(
  '/projects/:id/archive',
  requirePublishPermission('PROJECTS'),
  validate(idOnlySchema('id')),
  archiveProject,
);

// ── Placements: Companies ─────────────────────────────────────────────────────
router.get('/placements/companies', requirePermission('PLACEMENTS', 'read'), getCompanies);
router.post(
  '/placements/companies',
  requirePermission('PLACEMENTS'),
  validateAndSanitize(createCompanySchema),
  createCompany,
);
router.put(
  '/placements/companies/:id',
  requirePermission('PLACEMENTS'),
  validateAndSanitize(updateCompanySchema),
  updateCompany,
);
router.delete(
  '/placements/companies/:id',
  requirePermission('PLACEMENTS'),
  validate(idOnlySchema('id')),
  deleteCompany,
);

// ── Placements: Jobs ──────────────────────────────────────────────────────────
router.get('/placements/jobs', requirePermission('PLACEMENTS', 'read'), getJobs);
router.get(
  '/placements/jobs/:id',
  requirePermission('PLACEMENTS', 'read'),
  validate(idOnlySchema('id')),
  getJobById,
);
router.post(
  '/placements/jobs',
  requirePermission('PLACEMENTS'),
  validateAndSanitize(createJobSchema),
  createJob,
);
router.put(
  '/placements/jobs/:id',
  requirePermission('PLACEMENTS'),
  validateAndSanitize(updateJobSchema),
  updateJob,
);
router.delete(
  '/placements/jobs/:id',
  requirePermission('PLACEMENTS'),
  validate(idOnlySchema('id')),
  deleteJob,
);
router.patch(
  '/placements/jobs/:id/publish',
  requirePublishPermission('PLACEMENTS'),
  validate(idOnlySchema('id')),
  publishJob,
);

// ── Events ────────────────────────────────────────────────────────────────────
router.get('/events', requirePermission('EVENTS', 'read'), getEvents);
router.get(
  '/events/:id',
  requirePermission('EVENTS', 'read'),
  validate(idOnlySchema('id')),
  getEventById,
);
router.post(
  '/events',
  requirePermission('EVENTS'),
  validateAndSanitize(createEventSchema),
  createEvent,
);
router.put(
  '/events/:id',
  requirePermission('EVENTS'),
  validateAndSanitize(updateEventSchema),
  updateEvent,
);
router.delete(
  '/events/:id',
  requirePermission('EVENTS'),
  validate(idOnlySchema('id')),
  deleteEvent,
);
router.get(
  '/events/:id/registrations',
  requirePermission('EVENTS'),
  validate(idOnlySchema('id')),
  getEventRegistrations,
);
router.patch(
  '/events/:id/publish',
  requirePublishPermission('EVENTS'),
  validate(idOnlySchema('id')),
  publishEvent,
);
router.patch(
  '/events/:id/archive',
  requirePublishPermission('EVENTS'),
  validate(idOnlySchema('id')),
  archiveEvent,
);

// ── Notifications ──────────────────────────────────────────────────────────────
router.get('/notifications', requirePermission('NOTIFICATIONS', 'read'), getNotifications);
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
router.put(
  '/notifications/:id',
  requirePermission('NOTIFICATIONS'),
  validateAndSanitize(updateNotificationSchema),
  updateNotification,
);
router.delete(
  '/notifications/:id',
  requirePermission('NOTIFICATIONS'),
  validate(idOnlySchema('id')),
  deleteNotification,
);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports', requirePermission('REPORTS'), getManagerReports);

// ── Activity Log ──────────────────────────────────────────────────────────────
router.get('/activity', getActivityLog);

// ── Bulk Actions ──────────────────────────────────────────────────────────────
router.post('/content/bulk-publish', validate(bulkActionSchema), bulkPublish);
router.post('/content/bulk-archive', validate(bulkActionSchema), bulkArchive);
router.post('/content/bulk-delete', validate(bulkActionSchema), bulkDelete);
router.post('/content/bulk-restore', validate(bulkActionSchema), bulkRestore);
router.get('/content/trash/:entity', getTrash);

// ── Export (Module 16) ────────────────────────────────────────────────────────
router.get('/export', exportContent);
router.post('/import', importContent);

// ── Banners ───────────────────────────────────────────────────────────────────
router.get('/banners', getBanners);
router.post('/banners', validateAndSanitize(createBannerSchema), createBanner);
router.patch('/banners/:id', validateAndSanitize(updateBannerSchema), updateBanner);
router.delete('/banners/:id', validate(idOnlySchema('id')), deleteBanner);

// ── FAQ ───────────────────────────────────────────────────────────────────────
router.get('/faq/categories', getFaqCategories);
router.post('/faq/categories', validateAndSanitize(createFaqCategorySchema), createFaqCategory);
router.patch(
  '/faq/categories/:id',
  validateAndSanitize(updateFaqCategorySchema),
  updateFaqCategory,
);
router.delete('/faq/categories/:id', validate(idOnlySchema('id')), deleteFaqCategory);
router.get('/faq', getFaqs);
router.post('/faq', validateAndSanitize(createFaqSchema), createFaq);
router.patch('/faq/:id', validateAndSanitize(updateFaqSchema), updateFaq);
router.delete('/faq/:id', validate(idOnlySchema('id')), deleteFaq);

// ── Testimonials ──────────────────────────────────────────────────────────────
router.get('/testimonials', getTestimonials);
router.post('/testimonials', validateAndSanitize(createTestimonialSchema), createTestimonial);
router.patch('/testimonials/:id', validateAndSanitize(updateTestimonialSchema), updateTestimonial);
router.delete('/testimonials/:id', validate(idOnlySchema('id')), deleteTestimonial);

// ── Media Library ─────────────────────────────────────────────────────────────
router.get('/media', getMediaFiles);
router.get('/media/folders', getMediaFolders);
router.post('/media', validateAndSanitize(createMediaFileSchema), createMediaFile);
router.post('/media/upload', uploadMedia, uploadMediaFile);
router.patch('/media/:id', validateAndSanitize(updateMediaFileSchema), updateMediaFile);
router.delete('/media/:id', validate(idOnlySchema('id')), deleteMediaFile);

// ── Version History ───────────────────────────────────────────────────────────
router.get('/versions/:entity/:entityId', validate(z.object({
  params: z.object({
    entity: z.string({ required_error: 'entity is required' }),
    entityId: z.string({ required_error: 'entityId is required' }).uuid('Invalid entityId format'),
  }),
})), getVersionHistory);
router.post('/versions/:versionId/restore', validate(idOnlySchema('versionId')), restoreVersion);

// ── Global CMS Search ─────────────────────────────────────────────────────────
router.get('/search', globalCMSSearch);

export default router;
