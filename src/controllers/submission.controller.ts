import { Response, NextFunction, Request } from 'express';
import { submissionService } from '../services/submission.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { CODING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';
import { CreateSubmissionInput, GetSubmissionsQuery } from '../validators/submission.validator';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../constants';

/**
 * @swagger
 * tags:
 *   name: Submissions
 *   description: Code submission management
 */

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     tags: [Submissions]
 *     summary: Submit a solution
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubmissionRequest'
 *     responses:
 *       201:
 *         description: Solution submitted successfully
 */
export const createSubmission = async (
  req: AuthenticatedRequest & Request<object, object, CreateSubmissionInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const submission = await submissionService.submit(req.user.userId, req.body);
    sendCreated(res, CODING_MESSAGES.SUBMISSION_CREATED, submission);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/submissions:
 *   get:
 *     tags: [Submissions]
 *     summary: Get submissions (own for students, all for admins)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Submissions fetched successfully
 */
export const getSubmissions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const isAdmin = req.user.role === Role.ADMIN;
    const result = await submissionService.getAll(
      req.query as GetSubmissionsQuery,
      req.user.userId,
      isAdmin,
    );
    sendSuccess(res, CODING_MESSAGES.SUBMISSIONS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/submissions/{id}:
 *   get:
 *     tags: [Submissions]
 *     summary: Get a single submission by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Submission fetched successfully
 */
export const getSubmissionById = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const isAdmin = req.user.role === Role.ADMIN;
    const submission = await submissionService.getById(req.params.id, req.user.userId, isAdmin);
    sendSuccess(res, CODING_MESSAGES.SUBMISSION_FETCHED, submission);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/problems/{id}/submissions:
 *   get:
 *     tags: [Submissions]
 *     summary: Get submissions for a specific problem
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Submissions fetched successfully
 */
export const getSubmissionsByProblem = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const isAdmin = req.user.role === Role.ADMIN;
    const result = await submissionService.getByProblemId(
      req.params.id,
      req.query as GetSubmissionsQuery,
      req.user.userId,
      isAdmin,
    );
    sendSuccess(res, CODING_MESSAGES.SUBMISSIONS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/stats/coding:
 *   get:
 *     tags: [Submissions]
 *     summary: Get coding statistics for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Coding statistics fetched successfully
 */
export const getCodingStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const stats = await submissionService.getCodingStats(req.user.userId);
    sendSuccess(res, CODING_MESSAGES.CODING_STATS_FETCHED, stats);
  } catch (error) {
    next(error);
  }
};
