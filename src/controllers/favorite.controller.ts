import { Response, NextFunction, Request } from 'express';
import { favoriteService } from '../services/favorite.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { CODING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../constants';

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: Favorite problem management
 */

/**
 * @swagger
 * /api/problems/{id}/favorite:
 *   post:
 *     tags: [Favorites]
 *     summary: Add a problem to favorites
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Problem added to favorites
 *       409:
 *         description: Already in favorites
 */
export const addFavorite = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const favorite = await favoriteService.add(req.user.userId, req.params.id);
    sendCreated(res, CODING_MESSAGES.FAVORITE_ADDED, favorite);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/problems/{id}/favorite:
 *   delete:
 *     tags: [Favorites]
 *     summary: Remove a problem from favorites
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Problem removed from favorites
 */
export const removeFavorite = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    await favoriteService.remove(req.user.userId, req.params.id);
    sendSuccess(res, CODING_MESSAGES.FAVORITE_REMOVED, null);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     tags: [Favorites]
 *     summary: Get all favorite problems for the authenticated user
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
 *         description: Favorite problems fetched successfully
 */
export const getFavorites = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    const page = parseInt(String(req.query.page ?? '1'), 10);
    const limit = parseInt(String(req.query.limit ?? '20'), 10);
    const result = await favoriteService.getAll(req.user.userId, page, limit);
    sendSuccess(res, CODING_MESSAGES.FAVORITES_FETCHED, result);
  } catch (error) {
    next(error);
  }
};
