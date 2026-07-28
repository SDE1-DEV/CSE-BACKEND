import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PROJECT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project catalog management
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     tags: [Projects]
 *     summary: Get all projects (with filtering & pagination)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: [BEGINNER, INTERMEDIATE, ADVANCED, EXPERT] }
 *       - in: query
 *         name: technologyId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: isPublished
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Projects fetched successfully
 */
export const getProjects = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isAdmin = (req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.MANAGER);
    const result = await projectService.getProjects(req.query as Record<string, unknown>, isAdmin);
    sendSuccess(res, PROJECT_MESSAGES.PROJECTS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project fetched successfully
 *       404:
 *         description: Not found
 */
export const getProjectById = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isAdmin = (req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.MANAGER);
    const project = await projectService.getProjectById(req.params.id, isAdmin);
    sendSuccess(res, PROJECT_MESSAGES.PROJECT_FETCHED, project);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a project (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       201:
 *         description: Created
 */
export const createProject = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const project = await projectService.createProject(req.body);
    sendCreated(res, PROJECT_MESSAGES.PROJECT_CREATED, project);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     tags: [Projects]
 *     summary: Update a project (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated
 */
export const updateProject = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    sendSuccess(res, PROJECT_MESSAGES.PROJECT_UPDATED, project);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 */
export const deleteProject = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await projectService.deleteProject(req.params.id);
    sendSuccess(res, PROJECT_MESSAGES.PROJECT_DELETED, null);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/projects/{id}/technologies/{technologyId}:
 *   post:
 *     tags: [Projects]
 *     summary: Add technology to project (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: technologyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Technology added
 */
export const addProjectTechnology = async (
  req: AuthenticatedRequest & Request<{ id: string; technologyId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const project = await projectService.addTechnology(req.params.id, req.params.technologyId);
    sendSuccess(res, PROJECT_MESSAGES.TECHNOLOGY_ADDED, project);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/projects/{id}/technologies/{technologyId}:
 *   delete:
 *     tags: [Projects]
 *     summary: Remove technology from project (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: technologyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Technology removed
 */
export const removeProjectTechnology = async (
  req: AuthenticatedRequest & Request<{ id: string; technologyId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await projectService.removeTechnology(req.params.id, req.params.technologyId);
    sendSuccess(res, PROJECT_MESSAGES.TECHNOLOGY_REMOVED, null);
  } catch (error) {
    next(error);
  }
};
