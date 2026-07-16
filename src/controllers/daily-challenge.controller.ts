import { Response, NextFunction, Request } from 'express';
import { dailyChallengeService } from '../services/daily-challenge.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { CODING_MESSAGES } from '../constants';
import { CreateDailyChallengeInput, UpdateDailyChallengeInput } from '../validators/daily-challenge.validator';

/**
 * @swagger
 * tags:
 *   name: DailyChallenge
 *   description: Daily coding challenge management
 */

/**
 * @swagger
 * /api/daily-challenge:
 *   get:
 *     tags: [DailyChallenge]
 *     summary: Get today's daily challenge
 *     responses:
 *       200:
 *         description: Daily challenge fetched successfully
 *       404:
 *         description: No daily challenge for today
 */
export const getToday = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const challenge = await dailyChallengeService.getToday();
    sendSuccess(res, CODING_MESSAGES.DAILY_CHALLENGE_FETCHED, challenge);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/daily-challenge:
 *   post:
 *     tags: [DailyChallenge]
 *     summary: Create a daily challenge (Admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Daily challenge created successfully
 */
export const createDailyChallenge = async (
  req: Request<object, object, CreateDailyChallengeInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const challenge = await dailyChallengeService.create(req.body);
    sendCreated(res, CODING_MESSAGES.DAILY_CHALLENGE_CREATED, challenge);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/daily-challenge/{id}:
 *   put:
 *     tags: [DailyChallenge]
 *     summary: Update a daily challenge (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Daily challenge updated successfully
 */
export const updateDailyChallenge = async (
  req: Request<{ id: string }, object, UpdateDailyChallengeInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const challenge = await dailyChallengeService.update(req.params.id, req.body);
    sendSuccess(res, CODING_MESSAGES.DAILY_CHALLENGE_UPDATED, challenge);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/daily-challenge/{id}:
 *   delete:
 *     tags: [DailyChallenge]
 *     summary: Delete a daily challenge (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Daily challenge deleted successfully
 */
export const deleteDailyChallenge = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await dailyChallengeService.delete(req.params.id);
    sendSuccess(res, CODING_MESSAGES.DAILY_CHALLENGE_DELETED, null);
  } catch (error) {
    next(error);
  }
};
