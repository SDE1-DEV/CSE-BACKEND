import { Response, NextFunction, Request } from 'express';
import { codingProblemService } from '../services/coding-problem.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { CODING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';
import {
  CreateCodingProblemInput,
  UpdateCodingProblemInput,
  GetProblemsQuery,
} from '../validators/coding-problem.validator';

/**
 * @swagger
 * tags:
 *   name: Problems
 *   description: Coding problem management
 */

/**
 * @swagger
 * /api/problems:
 *   get:
 *     tags: [Problems]
 *     summary: Get all problems with filters, pagination, and sorting
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: [EASY, MEDIUM, HARD] }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: tagId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: companyId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: solved
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, difficulty, title, acceptanceRate, points] }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Problems fetched successfully
 */
export const getProblems = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = req.query as GetProblemsQuery;
    const userId = req.user?.userId;
    const isAdmin = (req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.MANAGER);

    // Non-admins only see published problems
    if (!isAdmin) {
      (query as Record<string, unknown>).isPublished = true;
    }

    const result = await codingProblemService.getAll(query, userId);
    sendSuccess(res, CODING_MESSAGES.PROBLEMS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/problems/{id}:
 *   get:
 *     tags: [Problems]
 *     summary: Get problem by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Problem fetched successfully
 *       404:
 *         description: Problem not found
 */
export const getProblemById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const problem = await codingProblemService.getById(req.params.id);
    sendSuccess(res, CODING_MESSAGES.PROBLEM_FETCHED, problem);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/problems:
 *   post:
 *     tags: [Problems]
 *     summary: Create a new problem (Admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Problem created successfully
 */
export const createProblem = async (
  req: Request<object, object, CreateCodingProblemInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const problem = await codingProblemService.create(req.body);
    sendCreated(res, CODING_MESSAGES.PROBLEM_CREATED, problem);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/problems/{id}:
 *   put:
 *     tags: [Problems]
 *     summary: Update a problem (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Problem updated successfully
 */
export const updateProblem = async (
  req: Request<{ id: string }, object, UpdateCodingProblemInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const problem = await codingProblemService.update(req.params.id, req.body);
    sendSuccess(res, CODING_MESSAGES.PROBLEM_UPDATED, problem);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/problems/{id}:
 *   delete:
 *     tags: [Problems]
 *     summary: Delete a problem (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Problem deleted successfully
 */
export const deleteProblem = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await codingProblemService.delete(req.params.id);
    sendSuccess(res, CODING_MESSAGES.PROBLEM_DELETED, null);
  } catch (error) {
    next(error);
  }
};

// ── Tag & Company M2M on problems ──────────────────────────────────────────────

export const addTagToProblem = async (
  req: Request<{ id: string; tagId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await codingProblemService.addTag(req.params.id, req.params.tagId);
    sendSuccess(res, 'Tag added to problem', null);
  } catch (error) {
    next(error);
  }
};

export const removeTagFromProblem = async (
  req: Request<{ id: string; tagId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await codingProblemService.removeTag(req.params.id, req.params.tagId);
    sendSuccess(res, 'Tag removed from problem', null);
  } catch (error) {
    next(error);
  }
};

export const addCompanyToProblem = async (
  req: Request<{ id: string; companyId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await codingProblemService.addCompany(req.params.id, req.params.companyId);
    sendSuccess(res, 'Company added to problem', null);
  } catch (error) {
    next(error);
  }
};

export const removeCompanyFromProblem = async (
  req: Request<{ id: string; companyId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await codingProblemService.removeCompany(req.params.id, req.params.companyId);
    sendSuccess(res, 'Company removed from problem', null);
  } catch (error) {
    next(error);
  }
};
