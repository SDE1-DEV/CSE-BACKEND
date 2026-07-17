/**
 * FPRD-10: Manager CMS Controller
 */

import { Response, NextFunction } from 'express';
import { managerService } from '../../services/manager/manager.service';
import { sendSuccess, sendCreated } from '../../utils/response';
import { ROLE_MESSAGES } from '../../constants';
import { AuthenticatedRequest } from '../../types';

/**
 * @swagger
 * tags:
 *   - name: Manager
 *     description: >
 *       FPRD-10 — Manager Enterprise CMS (MANAGER or SUPER_ADMIN role).
 *       All write operations are per-module permission gated.
 */

// ── CMS Dashboard ──────────────────────────────────────────────────────────────

export const getManagerCMSDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await managerService.getCMSDashboard(req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.MANAGER_DASHBOARD_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

// ── Dashboard ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /manager/dashboard:
 *   get:
 *     summary: Get Manager dashboard overview
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 */
export const getManagerDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await managerService.getDashboard(req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.MANAGER_DASHBOARD_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

// ── Learning: GET List handlers ────────────────────────────────────────────────

export const getCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, page, limit } = req.query as Record<string, string>;
    const data = await managerService.getCategories({ search, status, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Categories fetched', data);
  } catch (error) { next(error); }
};

export const getRoadmaps = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, categoryId, difficulty, page, limit } = req.query as Record<string, string>;
    const data = await managerService.getRoadmaps({ search, status, categoryId, difficulty, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Roadmaps fetched', data);
  } catch (error) { next(error); }
};

export const getRoadmapById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.getRoadmapById(req.params['id']);
    sendSuccess(res, 'Roadmap fetched', data);
  } catch (error) { next(error); }
};

export const getSections = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.getSections(req.params['roadmapId']);
    sendSuccess(res, 'Sections fetched', data);
  } catch (error) { next(error); }
};

export const getLessons = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, sectionId, page, limit } = req.query as Record<string, string>;
    const data = await managerService.getLessons({ search, status, sectionId, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Lessons fetched', data);
  } catch (error) { next(error); }
};

export const getLessonById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.getLessonById(req.params['id']);
    sendSuccess(res, 'Lesson fetched', data);
  } catch (error) { next(error); }
};

export const getResources = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, lessonId, type, page, limit } = req.query as Record<string, string>;
    const data = await managerService.getResources({ search, lessonId, type, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Resources fetched', data);
  } catch (error) { next(error); }
};

// ── Coding: GET List handlers ─────────────────────────────────────────────────

export const getProblems = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, difficulty, categoryId, page, limit } = req.query as Record<string, string>;
    const data = await managerService.getProblems({ search, status, difficulty, categoryId, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Problems fetched', data);
  } catch (error) { next(error); }
};

export const getProblemById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.getProblemById(req.params['id']);
    sendSuccess(res, 'Problem fetched', data);
  } catch (error) { next(error); }
};

export const getProblemCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, page, limit } = req.query as Record<string, string>;
    const data = await managerService.getProblemCategories({ search, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Problem categories fetched', data);
  } catch (error) { next(error); }
};

// ── Projects: GET List handlers ───────────────────────────────────────────────

export const getProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, difficulty, categoryId, page, limit } = req.query as Record<string, string>;
    const data = await managerService.getProjects({ search, status, difficulty, categoryId, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Projects fetched', data);
  } catch (error) { next(error); }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.getProjectById(req.params['id']);
    sendSuccess(res, 'Project fetched', data);
  } catch (error) { next(error); }
};

export const getProjectCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, page, limit } = req.query as Record<string, string>;
    const data = await managerService.getProjectCategories({ search, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Project categories fetched', data);
  } catch (error) { next(error); }
};

// ── Placements: GET List handlers ─────────────────────────────────────────────

export const getCompanies = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, page, limit } = req.query as Record<string, string>;
    const data = await managerService.getCompanies({ search, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Companies fetched', data);
  } catch (error) { next(error); }
};

export const getJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, companyId, type, page, limit } = req.query as Record<string, string>;
    const data = await managerService.getJobs({ search, status, companyId, type, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Jobs fetched', data);
  } catch (error) { next(error); }
};

export const getJobById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.getJobById(req.params['id']);
    sendSuccess(res, 'Job fetched', data);
  } catch (error) { next(error); }
};

// ── Events: GET List handlers ─────────────────────────────────────────────────

export const getEvents = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status, type, page, limit } = req.query as Record<string, string>;
    const data = await managerService.getEvents({ search, status, type, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Events fetched', data);
  } catch (error) { next(error); }
};

export const getEventById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.getEventById(req.params['id']);
    sendSuccess(res, 'Event fetched', data);
  } catch (error) { next(error); }
};

// ── Notifications: GET List handlers ──────────────────────────────────────────

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, type, page, limit } = req.query as Record<string, string>;
    const data = await managerService.getNotifications({ search, type, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Notifications fetched', data);
  } catch (error) { next(error); }
};

// ── Activity Log ───────────────────────────────────────────────────────────────

export const getActivityLog = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = req.query as Record<string, string>;
    const data = await managerService.getActivityLog(req.user!.userId, { page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Activity log fetched', data);
  } catch (error) { next(error); }
};

// ── Duplicate handlers ─────────────────────────────────────────────────────────

export const duplicateRoadmap = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.duplicateRoadmap(req.params['id'], req.user!.userId);
    sendCreated(res, 'Roadmap duplicated', data);
  } catch (error) { next(error); }
};

export const duplicateProblem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.duplicateProblem(req.params['id'], req.user!.userId);
    sendCreated(res, 'Problem duplicated', data);
  } catch (error) { next(error); }
};

// ── Publish/Archive for Projects, Jobs, Events ────────────────────────────────

export const publishProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.publishProject(req.params['id'], req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.CONTENT_PUBLISHED, data);
  } catch (error) { next(error); }
};

export const archiveProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.archiveProject(req.params['id'], req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.CONTENT_ARCHIVED, data);
  } catch (error) { next(error); }
};

export const publishJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.publishJob(req.params['id'], req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.CONTENT_PUBLISHED, data);
  } catch (error) { next(error); }
};

export const publishEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.publishEvent(req.params['id'], req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.CONTENT_PUBLISHED, data);
  } catch (error) { next(error); }
};

export const archiveEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.archiveEvent(req.params['id'], req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.CONTENT_ARCHIVED, data);
  } catch (error) { next(error); }
};

// ── Learning: Categories ───────────────────────────────────────────────────────

export const createCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.createCategory(req.body);
    sendCreated(res, 'Category created successfully', data);
  } catch (error) { next(error); }
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.updateCategory(req.params['id'], req.body);
    sendSuccess(res, 'Category updated successfully', data);
  } catch (error) { next(error); }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await managerService.deleteCategory(req.params['id']);
    sendSuccess(res, 'Category deleted successfully', null);
  } catch (error) { next(error); }
};

// ── Learning: Roadmaps ─────────────────────────────────────────────────────────

export const createRoadmap = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.createRoadmap(req.body, req.user!.userId);
    sendCreated(res, 'Roadmap created successfully', data);
  } catch (error) { next(error); }
};

export const updateRoadmap = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.updateRoadmap(req.params['id'], req.body, req.user!.userId);
    sendSuccess(res, 'Roadmap updated successfully', data);
  } catch (error) { next(error); }
};

export const deleteRoadmap = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await managerService.deleteRoadmap(req.params['id'], req.user!.userId);
    sendSuccess(res, 'Roadmap deleted successfully', null);
  } catch (error) { next(error); }
};

export const publishRoadmap = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.publishRoadmap(req.params['id'], req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.CONTENT_PUBLISHED, data);
  } catch (error) { next(error); }
};

export const archiveRoadmap = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.archiveRoadmap(req.params['id'], req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.CONTENT_ARCHIVED, data);
  } catch (error) { next(error); }
};

// ── Learning: Sections ─────────────────────────────────────────────────────────

export const createSection = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.createSection(req.body);
    sendCreated(res, 'Section created successfully', data);
  } catch (error) { next(error); }
};

export const updateSection = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.updateSection(req.params['id'], req.body);
    sendSuccess(res, 'Section updated successfully', data);
  } catch (error) { next(error); }
};

export const deleteSection = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await managerService.deleteSection(req.params['id']);
    sendSuccess(res, 'Section deleted successfully', null);
  } catch (error) { next(error); }
};

// ── Learning: Lessons ──────────────────────────────────────────────────────────

export const createLesson = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.createLesson(req.body, req.user!.userId);
    sendCreated(res, 'Lesson created successfully', data);
  } catch (error) { next(error); }
};

export const updateLesson = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.updateLesson(req.params['id'], req.body, req.user!.userId);
    sendSuccess(res, 'Lesson updated successfully', data);
  } catch (error) { next(error); }
};

export const deleteLesson = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await managerService.deleteLesson(req.params['id']);
    sendSuccess(res, 'Lesson deleted successfully', null);
  } catch (error) { next(error); }
};

// ── Learning: Resources ────────────────────────────────────────────────────────

export const createResource = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.createResource(req.body);
    sendCreated(res, 'Resource created successfully', data);
  } catch (error) { next(error); }
};

export const updateResource = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.updateResource(req.params['id'], req.body);
    sendSuccess(res, 'Resource updated successfully', data);
  } catch (error) { next(error); }
};

export const deleteResource = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await managerService.deleteResource(req.params['id']);
    sendSuccess(res, 'Resource deleted successfully', null);
  } catch (error) { next(error); }
};

// ── Coding ─────────────────────────────────────────────────────────────────────

export const createProblem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.createProblem(req.body, req.user!.userId);
    sendCreated(res, 'Problem created successfully', data);
  } catch (error) { next(error); }
};

export const updateProblem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.updateProblem(req.params['id'], req.body, req.user!.userId);
    sendSuccess(res, 'Problem updated successfully', data);
  } catch (error) { next(error); }
};

export const deleteProblem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await managerService.deleteProblem(req.params['id'], req.user!.userId);
    sendSuccess(res, 'Problem deleted successfully', null);
  } catch (error) { next(error); }
};

export const publishProblem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.publishProblem(req.params['id'], req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.CONTENT_PUBLISHED, data);
  } catch (error) { next(error); }
};

export const archiveProblem = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.archiveProblem(req.params['id'], req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.CONTENT_ARCHIVED, data);
  } catch (error) { next(error); }
};

// ── Projects ───────────────────────────────────────────────────────────────────

export const createProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.createProject(req.body, req.user!.userId);
    sendCreated(res, 'Project created successfully', data);
  } catch (error) { next(error); }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.updateProject(req.params['id'], req.body, req.user!.userId);
    sendSuccess(res, 'Project updated successfully', data);
  } catch (error) { next(error); }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await managerService.deleteProject(req.params['id'], req.user!.userId);
    sendSuccess(res, 'Project deleted successfully', null);
  } catch (error) { next(error); }
};

// ── Placements ─────────────────────────────────────────────────────────────────

export const createCompany = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.createCompany(req.body, req.user!.userId);
    sendCreated(res, 'Company created successfully', data);
  } catch (error) { next(error); }
};

export const updateCompany = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.updateCompany(req.params['id'], req.body);
    sendSuccess(res, 'Company updated successfully', data);
  } catch (error) { next(error); }
};

export const deleteCompany = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await managerService.deleteCompany(req.params['id']);
    sendSuccess(res, 'Company deleted successfully', null);
  } catch (error) { next(error); }
};

export const createJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.createJob(req.body, req.user!.userId);
    sendCreated(res, 'Job posted successfully', data);
  } catch (error) { next(error); }
};

export const updateJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.updateJob(req.params['id'], req.body);
    sendSuccess(res, 'Job updated successfully', data);
  } catch (error) { next(error); }
};

export const deleteJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await managerService.deleteJob(req.params['id']);
    sendSuccess(res, 'Job deleted successfully', null);
  } catch (error) { next(error); }
};

// ── Events ─────────────────────────────────────────────────────────────────────

export const createEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.createEvent(req.body, req.user!.userId);
    sendCreated(res, 'Event created successfully', data);
  } catch (error) { next(error); }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.updateEvent(req.params['id'], req.body);
    sendSuccess(res, 'Event updated successfully', data);
  } catch (error) { next(error); }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await managerService.deleteEvent(req.params['id']);
    sendSuccess(res, 'Event deleted successfully', null);
  } catch (error) { next(error); }
};

export const getEventRegistrations = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.getEventRegistrations(req.params['id']);
    sendSuccess(res, 'Event registrations fetched successfully', data);
  } catch (error) { next(error); }
};

// ── Notifications ──────────────────────────────────────────────────────────────

export const createNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.createNotification(req.body, req.user!.userId);
    sendCreated(res, 'Notification created successfully', data);
  } catch (error) { next(error); }
};

export const broadcastNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { targetRole, ...notificationData } = req.body;
    const data = await managerService.broadcastNotification(notificationData, targetRole, req.user!.userId);
    sendSuccess(res, 'Notification broadcast successfully', data);
  } catch (error) { next(error); }
};

export const updateNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.updateNotification(req.params['id'], req.body);
    sendSuccess(res, 'Notification updated successfully', data);
  } catch (error) { next(error); }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await managerService.deleteNotification(req.params['id']);
    sendSuccess(res, 'Notification deleted successfully', null);
  } catch (error) { next(error); }
};

// ── Reports ────────────────────────────────────────────────────────────────────

export const getManagerReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await managerService.getManagerReports(req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.REPORTS_EXPORTED, data);
  } catch (error) { next(error); }
};

// ── Export ─────────────────────────────────────────────────────────────────────

export const exportContent = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entity, format = 'json' } = req.query as Record<string, string>;
    if (!entity) { res.status(400).json({ success: false, message: 'entity param required' }); return; }
    const data = await managerService.exportContent(entity, format as 'json' | 'csv');
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${entity}-export.csv"`);
      res.send(data.data);
      return;
    }
    sendSuccess(res, 'Export ready', data);
  } catch (error) { next(error); }
};

// ── Bulk Restore ───────────────────────────────────────────────────────────────

export const bulkRestore = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entity, ids } = req.body;
    const data = await managerService.bulkRestore(entity, ids, req.user!.userId);
    sendSuccess(res, 'Content restored', data);
  } catch (error) { next(error); }
};

// ── Bulk Actions ───────────────────────────────────────────────────────────────

export const bulkPublish = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entity, ids } = req.body;
    const data = await managerService.bulkPublish(entity, ids, req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.CONTENT_PUBLISHED, data);
  } catch (error) { next(error); }
};

export const bulkArchive = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entity, ids } = req.body;
    const data = await managerService.bulkArchive(entity, ids, req.user!.userId);
    sendSuccess(res, ROLE_MESSAGES.CONTENT_ARCHIVED, data);
  } catch (error) { next(error); }
};

export const bulkDelete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entity, ids } = req.body;
    const data = await managerService.bulkDelete(entity, ids, req.user!.userId);
    sendSuccess(res, 'Content deleted successfully', data);
  } catch (error) { next(error); }
};
