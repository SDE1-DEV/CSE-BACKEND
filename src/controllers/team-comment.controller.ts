import { Request, Response, NextFunction } from 'express';
import { teamCommentService } from '../services/team-comment.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PROJECT_MESSAGES, HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';

/**
 * @swagger
 * tags:
 *   name: Task Comments
 *   description: Comments on tasks
 */

const requireAuth = (req: AuthenticatedRequest): string => {
  if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
  return req.user.userId;
};

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   post:
 *     tags: [Task Comments]
 *     summary: Add a comment to a task
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Comment added
 */
export const createComment = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    const { content } = req.body as { content: string };
    const comment = await teamCommentService.createComment(req.params.id, userId, content);
    sendCreated(res, PROJECT_MESSAGES.COMMENT_CREATED, comment);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   get:
 *     tags: [Task Comments]
 *     summary: Get all comments for a task
 *     security:
 *       - BearerAuth: []
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
 *         description: Comments fetched
 */
export const getTaskComments = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await teamCommentService.getCommentsByTask(req.params.id, page, limit);
    sendSuccess(res, PROJECT_MESSAGES.COMMENTS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     tags: [Task Comments]
 *     summary: Update a comment (author only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       200:
 *         description: Comment updated
 */
export const updateComment = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    const { content } = req.body as { content: string };
    const comment = await teamCommentService.updateComment(req.params.id, userId, content);
    sendSuccess(res, PROJECT_MESSAGES.COMMENT_UPDATED, comment);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     tags: [Task Comments]
 *     summary: Delete a comment (author only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Comment deleted
 */
export const deleteComment = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    await teamCommentService.deleteComment(req.params.id, userId);
    sendSuccess(res, PROJECT_MESSAGES.COMMENT_DELETED, null);
  } catch (error) {
    next(error);
  }
};
