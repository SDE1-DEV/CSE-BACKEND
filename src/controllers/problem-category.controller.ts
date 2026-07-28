import { Response, NextFunction, Request } from 'express';
import { problemCategoryService } from '../services/problem-category.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { CODING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';
import {
  CreateProblemCategoryInput,
  UpdateProblemCategoryInput,
  GetProblemCategoriesQuery,
} from '../validators/problem-category.validator';

/**
 * @swagger
 * tags:
 *   name: ProblemCategories
 *   description: Coding problem category management
 */

/**
 * @swagger
 * /api/problem-categories:
 *   get:
 *     tags: [ProblemCategories]
 *     summary: Get all problem categories
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
 *         description: Problem categories fetched successfully
 */
export const getProblemCategories = async (
  req: AuthenticatedRequest & Request<object, object, object, GetProblemCategoriesQuery>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isAdmin = (req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.MANAGER);
    const result = await problemCategoryService.getAll(req.query as GetProblemCategoriesQuery, isAdmin);
    sendSuccess(res, CODING_MESSAGES.PROBLEM_CATEGORIES_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/problem-categories/{id}:
 *   get:
 *     tags: [ProblemCategories]
 *     summary: Get problem category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Problem category fetched successfully
 *       404:
 *         description: Problem category not found
 */
export const getProblemCategoryById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await problemCategoryService.getById(req.params.id);
    sendSuccess(res, CODING_MESSAGES.PROBLEM_CATEGORY_FETCHED, category);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/problem-categories:
 *   post:
 *     tags: [ProblemCategories]
 *     summary: Create a new problem category (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProblemCategoryRequest'
 *     responses:
 *       201:
 *         description: Problem category created successfully
 *       409:
 *         description: Slug already exists
 */
export const createProblemCategory = async (
  req: Request<object, object, CreateProblemCategoryInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await problemCategoryService.create(req.body);
    sendCreated(res, CODING_MESSAGES.PROBLEM_CATEGORY_CREATED, category);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/problem-categories/{id}:
 *   put:
 *     tags: [ProblemCategories]
 *     summary: Update a problem category (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Problem category updated successfully
 */
export const updateProblemCategory = async (
  req: Request<{ id: string }, object, UpdateProblemCategoryInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await problemCategoryService.update(req.params.id, req.body);
    sendSuccess(res, CODING_MESSAGES.PROBLEM_CATEGORY_UPDATED, category);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/problem-categories/{id}:
 *   delete:
 *     tags: [ProblemCategories]
 *     summary: Delete a problem category (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Problem category deleted successfully
 */
export const deleteProblemCategory = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await problemCategoryService.delete(req.params.id);
    sendSuccess(res, CODING_MESSAGES.PROBLEM_CATEGORY_DELETED, null);
  } catch (error) {
    next(error);
  }
};
