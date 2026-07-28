import { Response, NextFunction, Request } from 'express';
import { testCaseService } from '../services/test-case.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { CODING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { Role } from '@prisma/client';
import { CreateTestCaseInput, UpdateTestCaseInput } from '../validators/test-case.validator';

/**
 * @swagger
 * tags:
 *   name: TestCases
 *   description: Problem test case management
 */

/**
 * @swagger
 * /api/problems/{id}/testcases:
 *   get:
 *     tags: [TestCases]
 *     summary: Get test cases for a problem (hidden ones only visible to admins)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Test cases fetched successfully
 */
export const getTestCases = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isAdmin = (req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.MANAGER);
    const testCases = await testCaseService.getByProblemId(req.params.id, isAdmin);
    sendSuccess(res, CODING_MESSAGES.TEST_CASES_FETCHED, testCases);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/testcases:
 *   post:
 *     tags: [TestCases]
 *     summary: Create a test case (Admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Test case created successfully
 */
export const createTestCase = async (
  req: Request<object, object, CreateTestCaseInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const testCase = await testCaseService.create(req.body);
    sendCreated(res, CODING_MESSAGES.TEST_CASE_CREATED, testCase);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/testcases/{id}:
 *   put:
 *     tags: [TestCases]
 *     summary: Update a test case (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Test case updated successfully
 */
export const updateTestCase = async (
  req: Request<{ id: string }, object, UpdateTestCaseInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const testCase = await testCaseService.update(req.params.id, req.body);
    sendSuccess(res, CODING_MESSAGES.TEST_CASE_UPDATED, testCase);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/testcases/{id}:
 *   delete:
 *     tags: [TestCases]
 *     summary: Delete a test case (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Test case deleted successfully
 */
export const deleteTestCase = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await testCaseService.delete(req.params.id);
    sendSuccess(res, CODING_MESSAGES.TEST_CASE_DELETED, null);
  } catch (error) {
    next(error);
  }
};
