import { Response, NextFunction, Request } from 'express';
import { roadmapService } from '../services/roadmap.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import {
  CreateRoadmapInput,
  UpdateRoadmapInput,
  GetRoadmapsQuery,
} from '../validators/roadmap.validator';
import { AppError } from '../middlewares/error.middleware';
import { Role } from '@prisma/client';

/**
 * @swagger
 * tags:
 *   name: Roadmaps
 *   description: Learning roadmap management
 */

/**
 * @swagger
 * /api/roadmaps:
 *   get:
 *     tags: [Roadmaps]
 *     summary: Get all roadmaps with filters and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: [BEGINNER, INTERMEDIATE, ADVANCED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: isPublished
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [displayOrder, createdAt, title, estimatedHours] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Roadmaps fetched successfully
 */
export const getRoadmaps = async (
  req: AuthenticatedRequest & Request<object, object, object, GetRoadmapsQuery>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isAdmin = (req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.MANAGER);
    const result = await roadmapService.getRoadmaps(req.query as GetRoadmapsQuery, isAdmin);
    sendSuccess(res, LEARNING_MESSAGES.ROADMAPS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/roadmaps/{id}:
 *   get:
 *     tags: [Roadmaps]
 *     summary: Get roadmap by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Roadmap fetched successfully
 *       404:
 *         description: Roadmap not found
 */
export const getRoadmapById = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isAdmin = (req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.MANAGER);
    const roadmap = await roadmapService.getRoadmapById(req.params.id, isAdmin);
    sendSuccess(res, LEARNING_MESSAGES.ROADMAP_FETCHED, roadmap);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/roadmaps:
 *   post:
 *     tags: [Roadmaps]
 *     summary: Create a new roadmap (Admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Roadmap created successfully
 */
export const createRoadmap = async (
  req: AuthenticatedRequest & Request<object, object, CreateRoadmapInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const roadmap = await roadmapService.createRoadmap(req.body);
    sendCreated(res, LEARNING_MESSAGES.ROADMAP_CREATED, roadmap);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/roadmaps/{id}:
 *   put:
 *     tags: [Roadmaps]
 *     summary: Update a roadmap (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Roadmap updated successfully
 */
export const updateRoadmap = async (
  req: AuthenticatedRequest & Request<{ id: string }, object, UpdateRoadmapInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const roadmap = await roadmapService.updateRoadmap(req.params.id, req.body, true);
    sendSuccess(res, LEARNING_MESSAGES.ROADMAP_UPDATED, roadmap);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/roadmaps/{id}:
 *   delete:
 *     tags: [Roadmaps]
 *     summary: Delete a roadmap (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Roadmap deleted successfully
 */
export const deleteRoadmap = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    await roadmapService.deleteRoadmap(req.params.id);
    sendSuccess(res, LEARNING_MESSAGES.ROADMAP_DELETED, null);
  } catch (error) {
    next(error);
  }
};
