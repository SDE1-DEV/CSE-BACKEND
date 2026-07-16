import { Response, NextFunction, Request } from 'express';
import { searchService } from '../services/search.service';
import { sendSuccess } from '../utils/response';
import { LEARNING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { SearchQuery } from '../validators/search.validator';

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Global search across categories, roadmaps, and lessons
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     tags: [Search]
 *     summary: Global search across categories, roadmaps, and lessons
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Search results fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories: { type: array }
 *                     roadmaps: { type: array }
 *                     lessons: { type: array }
 *                 errors: { type: null }
 *       400:
 *         description: Validation error (missing or invalid query)
 */
export const globalSearch = async (
  req: AuthenticatedRequest & Request<object, object, object, SearchQuery>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const results = await searchService.globalSearch(
      req.query.q as string,
      req.user?.role,
    );
    sendSuccess(res, LEARNING_MESSAGES.SEARCH_RESULTS_FETCHED, results);
  } catch (error) {
    next(error);
  }
};
