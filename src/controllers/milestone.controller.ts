import { Request, Response, NextFunction } from 'express';
import { milestoneService } from '../services/milestone.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PROJECT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../constants';

/**
 * @swagger
 * tags:
 *   name: Milestones
 *   description: Project milestone management
 */

const requireAuth = (req: AuthenticatedRequest): string => {
  if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
  return req.user.userId;
};

/**
 * @swagger
 * /api/milestones:
 *   get:
 *     tags: [Milestones]
 *     summary: Get milestones (filterable by project, status)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: projectId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, IN_PROGRESS, COMPLETED] }
 *     responses:
 *       200:
 *         description: Milestones fetched
 */
export const getMilestones = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await milestoneService.getMilestones(req.query as Record<string, unknown>);
    sendSuccess(res, PROJECT_MESSAGES.MILESTONES_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/milestones:
 *   post:
 *     tags: [Milestones]
 *     summary: Create a milestone
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMilestoneRequest'
 *     responses:
 *       201:
 *         description: Milestone created
 */
export const createMilestone = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    const milestone = await milestoneService.createMilestone(req.body, userId);
    sendCreated(res, PROJECT_MESSAGES.MILESTONE_CREATED, milestone);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/milestones/{id}:
 *   put:
 *     tags: [Milestones]
 *     summary: Update a milestone
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
export const updateMilestone = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    const milestone = await milestoneService.updateMilestone(req.params.id, req.body, userId);
    sendSuccess(res, PROJECT_MESSAGES.MILESTONE_UPDATED, milestone);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/milestones/{id}:
 *   delete:
 *     tags: [Milestones]
 *     summary: Delete a milestone
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
export const deleteMilestone = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    await milestoneService.deleteMilestone(req.params.id, userId);
    sendSuccess(res, PROJECT_MESSAGES.MILESTONE_DELETED, null);
  } catch (error) {
    next(error);
  }
};
