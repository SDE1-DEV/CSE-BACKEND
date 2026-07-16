import { Response, NextFunction, Request } from 'express';
import { codingSearchService } from '../services/coding-search.service';
import { sendSuccess } from '../utils/response';
import { CODING_MESSAGES } from '../constants';
import { ProblemDifficulty } from '@prisma/client';

/**
 * @swagger
 * tags:
 *   name: CodingSearch
 *   description: Search across coding problems, tags, companies, and categories
 */

/**
 * @swagger
 * /api/coding/search:
 *   get:
 *     tags: [CodingSearch]
 *     summary: Search problems by title, tags, companies, category, or difficulty
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: difficulty
 *         schema: { type: string, enum: [EASY, MEDIUM, HARD] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Search results fetched successfully
 */
export const codingSearch = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const q = String(req.query.q ?? '');
    const difficulty = req.query.difficulty as ProblemDifficulty | undefined;
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const result = await codingSearchService.search(q, difficulty, page, limit);
    sendSuccess(res, CODING_MESSAGES.CODING_SEARCH_FETCHED, result);
  } catch (error) {
    next(error);
  }
};
