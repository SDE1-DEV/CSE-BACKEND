import { Request, Response, NextFunction } from 'express';
import { projectCategoryService } from '../services/project-category.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PROJECT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';

/**
 * @swagger
 * tags:
 *   name: Project Categories
 *   description: Project category management
 */

/**
 * @swagger
 * /api/project-categories:
 *   get:
 *     tags: [Project Categories]
 *     summary: Get all project categories
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Project categories fetched successfully
 */
export const getProjectCategories = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isAdmin = (req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.MANAGER);
    const result = await projectCategoryService.getCategories(req.query as Record<string, unknown>, isAdmin);
    sendSuccess(res, PROJECT_MESSAGES.PROJECT_CATEGORIES_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/project-categories/{id}:
 *   get:
 *     tags: [Project Categories]
 *     summary: Get project category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project category fetched successfully
 *       404:
 *         description: Not found
 */
export const getProjectCategoryById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await projectCategoryService.getCategoryById(req.params.id);
    sendSuccess(res, PROJECT_MESSAGES.PROJECT_CATEGORY_FETCHED, category);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/project-categories:
 *   post:
 *     tags: [Project Categories]
 *     summary: Create a project category (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectCategoryRequest'
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Slug already exists
 */
export const createProjectCategory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await projectCategoryService.createCategory(req.body);
    sendCreated(res, PROJECT_MESSAGES.PROJECT_CATEGORY_CREATED, category);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/project-categories/{id}:
 *   put:
 *     tags: [Project Categories]
 *     summary: Update a project category (Admin only)
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
export const updateProjectCategory = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await projectCategoryService.updateCategory(req.params.id, req.body);
    sendSuccess(res, PROJECT_MESSAGES.PROJECT_CATEGORY_UPDATED, category);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/project-categories/{id}:
 *   delete:
 *     tags: [Project Categories]
 *     summary: Delete a project category (Admin only)
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
export const deleteProjectCategory = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await projectCategoryService.deleteCategory(req.params.id);
    sendSuccess(res, PROJECT_MESSAGES.PROJECT_CATEGORY_DELETED, null);
  } catch (error) {
    next(error);
  }
};
