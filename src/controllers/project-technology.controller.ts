import { Request, Response, NextFunction } from 'express';
import { projectTechnologyService } from '../services/project-technology.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PROJECT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';

/**
 * @swagger
 * tags:
 *   name: Project Technologies
 *   description: Project technology management
 */

/**
 * @swagger
 * /api/project-technologies:
 *   get:
 *     tags: [Project Technologies]
 *     summary: Get all technologies
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
 *     responses:
 *       200:
 *         description: Technologies fetched successfully
 */
export const getProjectTechnologies = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await projectTechnologyService.getTechnologies(req.query as Record<string, unknown>);
    sendSuccess(res, PROJECT_MESSAGES.TECHNOLOGIES_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/project-technologies/{id}:
 *   get:
 *     tags: [Project Technologies]
 *     summary: Get technology by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Technology fetched
 *       404:
 *         description: Not found
 */
export const getProjectTechnologyById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tech = await projectTechnologyService.getTechnologyById(req.params.id);
    sendSuccess(res, PROJECT_MESSAGES.TECHNOLOGY_FETCHED, tech);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/project-technologies:
 *   post:
 *     tags: [Project Technologies]
 *     summary: Create a technology (Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTechnologyRequest'
 *     responses:
 *       201:
 *         description: Created
 */
export const createProjectTechnology = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tech = await projectTechnologyService.createTechnology(req.body);
    sendCreated(res, PROJECT_MESSAGES.TECHNOLOGY_CREATED, tech);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/project-technologies/{id}:
 *   put:
 *     tags: [Project Technologies]
 *     summary: Update a technology (Admin only)
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
export const updateProjectTechnology = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tech = await projectTechnologyService.updateTechnology(req.params.id, req.body);
    sendSuccess(res, PROJECT_MESSAGES.TECHNOLOGY_UPDATED, tech);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/project-technologies/{id}:
 *   delete:
 *     tags: [Project Technologies]
 *     summary: Delete a technology (Admin only)
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
export const deleteProjectTechnology = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await projectTechnologyService.deleteTechnology(req.params.id);
    sendSuccess(res, PROJECT_MESSAGES.TECHNOLOGY_DELETED, null);
  } catch (error) {
    next(error);
  }
};
