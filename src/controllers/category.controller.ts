import { Response, NextFunction, Request } from 'express';
import { categoryService } from '../services/category.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  GetCategoriesQuery,
} from '../validators/category.validator';
import { AppError } from '../middlewares/error.middleware';
import { Role } from '@prisma/client';

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Learning category management
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
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
 *         description: Categories fetched successfully
 */
export const getCategories = async (
  req: AuthenticatedRequest & Request<object, object, object, GetCategoriesQuery>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isAdmin = req.user?.role === Role.ADMIN;
    const result = await categoryService.getCategories(req.query as GetCategoriesQuery, isAdmin);
    sendSuccess(res, LEARNING_MESSAGES.CATEGORIES_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Category fetched successfully
 *       404:
 *         description: Category not found
 */
export const getCategoryById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    sendSuccess(res, LEARNING_MESSAGES.CATEGORY_FETCHED, category);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       409:
 *         description: Slug already exists
 */
export const createCategory = async (
  req: AuthenticatedRequest & Request<object, object, CreateCategoryInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const category = await categoryService.createCategory(req.body);
    sendCreated(res, LEARNING_MESSAGES.CATEGORY_CREATED, category);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update a category (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 */
export const updateCategory = async (
  req: AuthenticatedRequest & Request<{ id: string }, object, UpdateCategoryInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const category = await categoryService.updateCategory(req.params.id, req.body);
    sendSuccess(res, LEARNING_MESSAGES.CATEGORY_UPDATED, category);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
export const deleteCategory = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    await categoryService.deleteCategory(req.params.id);
    sendSuccess(res, LEARNING_MESSAGES.CATEGORY_DELETED, null);
  } catch (error) {
    next(error);
  }
};
