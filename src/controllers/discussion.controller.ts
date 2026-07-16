import { Response, NextFunction, Request } from 'express';
import { discussionService } from '../services/discussion.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { CODING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../constants';
import { Role } from '@prisma/client';
import { CreateDiscussionInput, UpdateDiscussionInput, GetDiscussionsQuery } from '../validators/discussion.validator';

/**
 * @swagger
 * tags:
 *   name: Discussions
 *   description: Problem discussion management
 */

/**
 * @swagger
 * /api/problems/{id}/discussions:
 *   get:
 *     tags: [Discussions]
 *     summary: Get discussions for a problem
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Discussions fetched successfully
 */
export const getDiscussions = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await discussionService.getByProblemId(
      req.params.id,
      req.query as GetDiscussionsQuery,
    );
    sendSuccess(res, CODING_MESSAGES.DISCUSSIONS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/problems/{id}/discussions:
 *   post:
 *     tags: [Discussions]
 *     summary: Post a discussion on a problem
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Discussion posted successfully
 */
export const createDiscussion = async (
  req: AuthenticatedRequest & Request<{ id: string }, object, CreateDiscussionInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const discussion = await discussionService.create(req.user.userId, req.params.id, req.body);
    sendCreated(res, CODING_MESSAGES.DISCUSSION_CREATED, discussion);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/discussions/{id}:
 *   put:
 *     tags: [Discussions]
 *     summary: Update a discussion (own or mentor/admin)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Discussion updated successfully
 */
export const updateDiscussion = async (
  req: AuthenticatedRequest & Request<{ id: string }, object, UpdateDiscussionInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const isAdminOrMentor = req.user.role === Role.ADMIN || req.user.role === Role.MENTOR;
    const discussion = await discussionService.update(
      req.params.id,
      req.user.userId,
      req.body,
      isAdminOrMentor,
    );
    sendSuccess(res, CODING_MESSAGES.DISCUSSION_UPDATED, discussion);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/discussions/{id}:
 *   delete:
 *     tags: [Discussions]
 *     summary: Delete a discussion (own or mentor/admin)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Discussion deleted successfully
 */
export const deleteDiscussion = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const isAdminOrMentor = req.user.role === Role.ADMIN || req.user.role === Role.MENTOR;
    await discussionService.delete(req.params.id, req.user.userId, isAdminOrMentor);
    sendSuccess(res, CODING_MESSAGES.DISCUSSION_DELETED, null);
  } catch (error) {
    next(error);
  }
};
