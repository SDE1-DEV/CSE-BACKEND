import { Response, NextFunction, Request } from 'express';
import { sectionService } from '../services/section.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { CreateSectionInput, UpdateSectionInput } from '../validators/section.validator';
import { AppError } from '../middlewares/error.middleware';

/**
 * @swagger
 * tags:
 *   name: Sections
 *   description: Roadmap section management
 */

/**
 * @swagger
 * /api/sections/{roadmapId}:
 *   get:
 *     tags: [Sections]
 *     summary: Get all sections for a roadmap
 *     parameters:
 *       - in: path
 *         name: roadmapId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Sections fetched successfully
 *       404:
 *         description: Roadmap not found
 */
export const getSectionsByRoadmap = async (
  req: AuthenticatedRequest & Request<{ roadmapId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sections = await sectionService.getSectionsByRoadmap(
      req.params.roadmapId,
      req.user?.role,
    );
    sendSuccess(res, LEARNING_MESSAGES.SECTIONS_FETCHED, sections);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/sections:
 *   post:
 *     tags: [Sections]
 *     summary: Create a new section (Admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Section created successfully
 */
export const createSection = async (
  req: AuthenticatedRequest & Request<object, object, CreateSectionInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const section = await sectionService.createSection(req.body);
    sendCreated(res, LEARNING_MESSAGES.SECTION_CREATED, section);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/sections/{id}:
 *   put:
 *     tags: [Sections]
 *     summary: Update a section (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Section updated successfully
 */
export const updateSection = async (
  req: AuthenticatedRequest & Request<{ id: string }, object, UpdateSectionInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const section = await sectionService.updateSection(req.params.id, req.body);
    sendSuccess(res, LEARNING_MESSAGES.SECTION_UPDATED, section);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/sections/{id}:
 *   delete:
 *     tags: [Sections]
 *     summary: Delete a section (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Section deleted successfully
 */
export const deleteSection = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    await sectionService.deleteSection(req.params.id);
    sendSuccess(res, LEARNING_MESSAGES.SECTION_DELETED, null);
  } catch (error) {
    next(error);
  }
};
