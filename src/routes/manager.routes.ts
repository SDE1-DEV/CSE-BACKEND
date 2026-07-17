/**
 * FPRD-10: Manager CMS Routes
 * Protected by authenticate + requireManager + per-module requirePermission
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
import { requirePermission, requirePublishPermission } from '../middlewares/permission.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  getBanners, createBanner, updateBanner, deleteBanner,
  getFaqCategories, getFaqs, createFaq, updateFaq, deleteFaq,
  createFaqCategory, updateFaqCategory, deleteFaqCategory,
  getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  getMediaFiles, createMediaFile, updateMediaFile, deleteMediaFile, getMediaFolders,
  getVersionHistory, restoreVersion,
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

  // Export
  exportContent,
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
 *   description: FPRD-10 Enterprise CMS — Manager content management (MANAGER or SUPER_ADMIN role)
 */

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', getManagerDashboard);
router.get('/cms/dashboard', getManagerCMSDashboard);

// ── Learning: Categories ──────────────────────────────────────────────────────
router.get('/categories', requirePermission('LEARNING', 'read'), getCategories);
router.post('/categories', requirePermission('LEARNING'), createCategory);
router.patch('/categories/:id', requirePermission('LEARNING'), updateCategory);
router.delete('/categories/:id', requirePermission('LEARNING'), deleteCategory);

// ── Learning: Roadmaps ────────────────────────────────────────────────────────
router.get('/roadmaps', requirePermission('LEARNING', 'read'), getRoadmaps);
router.get('/roadmaps/:id', requirePermission('LEARNING', 'read'), getRoadmapById);
router.post('/roadmaps', requirePermission('LEARNING'), createRoadmap);
router.patch('/roadmaps/:id', requirePermission('LEARNING'), updateRoadmap);
router.delete('/roadmaps/:id', requirePermission('LEARNING'), deleteRoadmap);
router.patch('/roadmaps/:id/publish', requirePublishPermission('LEARNING'), publishRoadmap);
router.patch('/roadmaps/:id/archive', requirePublishPermission('LEARNING'), archiveRoadmap);
router.post('/roadmaps/:id/duplicate', requirePermission('LEARNING'), duplicateRoadmap);

// ── Learning: Sections ────────────────────────────────────────────────────────
router.get('/roadmaps/:roadmapId/sections', requirePermission('LEARNING', 'read'), getSections);
router.post('/sections', requirePermission('LEARNING'), createSection);
router.patch('/sections/:id', requirePermission('LEARNING'), updateSection);
router.delete('/sections/:id', requirePermission('LEARNING'), deleteSection);

// ── Learning: Lessons ─────────────────────────────────────────────────────────
router.get('/lessons', requirePermission('LEARNING', 'read'), getLessons);
router.get('/lessons/:id', requirePermission('LEARNING', 'read'), getLessonById);
router.post('/lessons', requirePermission('LEARNING'), createLesson);
router.patch('/lessons/:id', requirePermission('LEARNING'), updateLesson);
router.delete('/lessons/:id', requirePermission('LEARNING'), deleteLesson);

// ── Learning: Resources ───────────────────────────────────────────────────────
router.get('/resources', requirePermission('LEARNING', 'read'), getResources);
router.post('/resources', requirePermission('LEARNING'), createResource);
router.patch('/resources/:id', requirePermission('LEARNING'), updateResource);
router.delete('/resources/:id', requirePermission('LEARNING'), deleteResource);

// ── Coding: Problem Categories ────────────────────────────────────────────────
router.get('/problem-categories', requirePermission('CODING', 'read'), getProblemCategories);
router.post('/problem-categories', requirePermission('CODING'), createProblemCategory);
router.patch('/problem-categories/:id', requirePermission('CODING'), updateProblemCategory);
router.delete('/problem-categories/:id', requirePermission('CODING'), deleteProblemCategory);

// ── Coding: Problems ──────────────────────────────────────────────────────────
router.get('/problems', requirePermission('CODING', 'read'), getProblems);
router.get('/problems/:id', requirePermission('CODING', 'read'), getProblemById);
router.post('/problems', requirePermission('CODING'), createProblem);
router.put('/problems/:id', requirePermission('CODING'), updateProblem);
router.delete('/problems/:id', requirePermission('CODING'), deleteProblem);
router.patch('/problems/:id/publish', requirePublishPermission('CODING'), publishProblem);
router.patch('/problems/:id/archive', requirePublishPermission('CODING'), archiveProblem);
router.post('/problems/:id/duplicate', requirePermission('CODING'), duplicateProblem);

// ── Projects: Categories ──────────────────────────────────────────────────────
router.get('/project-categories', requirePermission('PROJECTS', 'read'), getProjectCategories);
router.post('/project-categories', requirePermission('PROJECTS'), createProjectCategory);
router.patch('/project-categories/:id', requirePermission('PROJECTS'), updateProjectCategory);
router.delete('/project-categories/:id', requirePermission('PROJECTS'), deleteProjectCategory);

// ── Projects ──────────────────────────────────────────────────────────────────
router.get('/projects', requirePermission('PROJECTS', 'read'), getProjects);
router.get('/projects/:id', requirePermission('PROJECTS', 'read'), getProjectById);
router.post('/projects', requirePermission('PROJECTS'), createProject);
router.put('/projects/:id', requirePermission('PROJECTS'), updateProject);
router.delete('/projects/:id', requirePermission('PROJECTS'), deleteProject);
router.patch('/projects/:id/publish', requirePublishPermission('PROJECTS'), publishProject);
router.patch('/projects/:id/archive', requirePublishPermission('PROJECTS'), archiveProject);

// ── Placements: Companies ─────────────────────────────────────────────────────
router.get('/placements/companies', requirePermission('PLACEMENTS', 'read'), getCompanies);
router.post('/placements/companies', requirePermission('PLACEMENTS'), createCompany);
router.put('/placements/companies/:id', requirePermission('PLACEMENTS'), updateCompany);
router.delete('/placements/companies/:id', requirePermission('PLACEMENTS'), deleteCompany);

// ── Placements: Jobs ──────────────────────────────────────────────────────────
router.get('/placements/jobs', requirePermission('PLACEMENTS', 'read'), getJobs);
router.get('/placements/jobs/:id', requirePermission('PLACEMENTS', 'read'), getJobById);
router.post('/placements/jobs', requirePermission('PLACEMENTS'), createJob);
router.put('/placements/jobs/:id', requirePermission('PLACEMENTS'), updateJob);
router.delete('/placements/jobs/:id', requirePermission('PLACEMENTS'), deleteJob);
router.patch('/placements/jobs/:id/publish', requirePublishPermission('PLACEMENTS'), publishJob);

// ── Events ────────────────────────────────────────────────────────────────────
router.get('/events', requirePermission('EVENTS', 'read'), getEvents);
router.get('/events/:id', requirePermission('EVENTS', 'read'), getEventById);
router.post('/events', requirePermission('EVENTS'), createEvent);
router.put('/events/:id', requirePermission('EVENTS'), updateEvent);
router.delete('/events/:id', requirePermission('EVENTS'), deleteEvent);
router.get('/events/:id/registrations', requirePermission('EVENTS'), getEventRegistrations);
router.patch('/events/:id/publish', requirePublishPermission('EVENTS'), publishEvent);
router.patch('/events/:id/archive', requirePublishPermission('EVENTS'), archiveEvent);

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
router.put('/notifications/:id', requirePermission('NOTIFICATIONS'), updateNotification);
router.delete('/notifications/:id', requirePermission('NOTIFICATIONS'), deleteNotification);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports', requirePermission('REPORTS'), getManagerReports);

// ── Activity Log ──────────────────────────────────────────────────────────────
router.get('/activity', getActivityLog);

// ── Bulk Actions ──────────────────────────────────────────────────────────────
router.post('/content/bulk-publish',  validate(bulkActionSchema), bulkPublish);
router.post('/content/bulk-archive',  validate(bulkActionSchema), bulkArchive);
router.post('/content/bulk-delete',   validate(bulkActionSchema), bulkDelete);
router.post('/content/bulk-restore',  validate(bulkActionSchema), bulkRestore);

// ── Export (Module 16) ────────────────────────────────────────────────────────
router.get('/export', exportContent);

// ── Banners ───────────────────────────────────────────────────────────────────
router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.patch('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

// ── FAQ ───────────────────────────────────────────────────────────────────────
router.get('/faq/categories', getFaqCategories);
router.post('/faq/categories', createFaqCategory);
router.patch('/faq/categories/:id', updateFaqCategory);
router.delete('/faq/categories/:id', deleteFaqCategory);
router.get('/faq', getFaqs);
router.post('/faq', createFaq);
router.patch('/faq/:id', updateFaq);
router.delete('/faq/:id', deleteFaq);

// ── Testimonials ──────────────────────────────────────────────────────────────
router.get('/testimonials', getTestimonials);
router.post('/testimonials', createTestimonial);
router.patch('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

// ── Media Library ─────────────────────────────────────────────────────────────
router.get('/media', getMediaFiles);
router.get('/media/folders', getMediaFolders);
router.post('/media', createMediaFile);
router.patch('/media/:id', updateMediaFile);
router.delete('/media/:id', deleteMediaFile);

// ── Version History ───────────────────────────────────────────────────────────
router.get('/versions/:entity/:entityId', getVersionHistory);
router.post('/versions/:versionId/restore', restoreVersion);

// ── Global CMS Search ─────────────────────────────────────────────────────────
router.get('/search', globalCMSSearch);

export default router;
