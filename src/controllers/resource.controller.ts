import { Response, NextFunction, Request } from 'express';
import { resourceService } from '../services/resource.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { CreateResourceInput, UpdateResourceInput } from '../validators/resource.validator';
import { AppError } from '../middlewares/error.middleware';

/**
 * @swagger
 * tags:
 *   name: Resources
 *   description: Lesson resource management
 */

/**
 * @swagger
 * /api/resources/{lessonId}:
 *   get:
 *     tags: [Resources]
 *     summary: Get all resources for a lesson
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Resources fetched successfully
 *       404:
 *         description: Lesson not found
 */
export const getResourcesByLesson = async (
  req: Request<{ lessonId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const resources = await resourceService.getResourcesByLesson(req.params.lessonId);
    sendSuccess(res, LEARNING_MESSAGES.RESOURCES_FETCHED, resources);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/resources:
 *   post:
 *     tags: [Resources]
 *     summary: Create a new resource (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateResourceRequest'
 *     responses:
 *       201:
 *         description: Resource created successfully
 *       404:
 *         description: Lesson not found
 */
export const createResource = async (
  req: AuthenticatedRequest & Request<object, object, CreateResourceInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const resource = await resourceService.createResource(req.body);
    sendCreated(res, LEARNING_MESSAGES.RESOURCE_CREATED, resource);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/resources/{id}:
 *   put:
 *     tags: [Resources]
 *     summary: Update a resource (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *       404:
 *         description: Resource not found
 */
export const updateResource = async (
  req: AuthenticatedRequest & Request<{ id: string }, object, UpdateResourceInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const resource = await resourceService.updateResource(req.params.id, req.body);
    sendSuccess(res, LEARNING_MESSAGES.RESOURCE_UPDATED, resource);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/resources/{id}:
 *   delete:
 *     tags: [Resources]
 *     summary: Delete a resource (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 *       404:
 *         description: Resource not found
 */
export const deleteResource = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    await resourceService.deleteResource(req.params.id);
    sendSuccess(res, LEARNING_MESSAGES.RESOURCE_DELETED, null);
  } catch (error) {
    next(error);
  }
};
