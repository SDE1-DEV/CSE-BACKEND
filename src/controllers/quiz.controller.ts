/**
 * Quiz & Practice Questions Controller
 * Handles:
 *   GET  /learning/lessons/:id/practice        → getPracticeQuestions
 *   GET  /learning/lessons/:id/quiz            → getQuizQuestions
 *   POST /learning/lessons/:id/quiz/submit     → submitQuiz
 *   GET  /learning/stats                       → getLearningStats
 *   POST /learning/lessons/:id/start           → markLessonStarted
 *
 * NOTE: The legacy lesson_progress and lessons tables still physically exist in
 * production (created by migration 20260715123406_learning_ecosystem, never dropped).
 * Prisma Client no longer has models for them — we use prisma.$queryRaw for those.
 */

import { Request, Response, NextFunction } from 'express';
import { quizService } from '../services/quiz.service';
import { sendSuccess } from '../utils/response';
import { QUIZ_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../constants';

// ── Practice Questions ────────────────────────────────────────────────────────

export const getPracticeQuestions = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const questions = await quizService.getPracticeQuestions(req.params.id);
    sendSuccess(res, QUIZ_MESSAGES.PRACTICE_FETCHED, questions);
  } catch (error) {
    next(error);
  }
};

// ── Quiz Questions ────────────────────────────────────────────────────────────

export const getQuizQuestions = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const questions = await quizService.getQuizQuestions(req.params.id);
    sendSuccess(res, QUIZ_MESSAGES.QUIZ_FETCHED, questions);
  } catch (error) {
    next(error);
  }
};

// ── Quiz Submission ───────────────────────────────────────────────────────────

export const submitQuiz = async (
  req: AuthenticatedRequest & Request<{ id: string }, object, { answers: Record<string, number> }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const { answers } = req.body ?? {};
    if (!answers || typeof answers !== 'object') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'answers object is required');
    }
    const result = await quizService.submitQuiz(req.params.id, req.user.userId, answers);
    sendSuccess(res, QUIZ_MESSAGES.QUIZ_SUBMITTED, result);
  } catch (error) {
    next(error);
  }
};

// ── Learning Stats ────────────────────────────────────────────────────────────

export const getLearningStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const stats = await quizService.getLearningStats(req.user.userId);
    sendSuccess(res, QUIZ_MESSAGES.STATS_FETCHED, stats);
  } catch (error) {
    next(error);
  }
};

// ── Mark Lesson Started ───────────────────────────────────────────────────────

export const markLessonStarted = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const { prisma } = await import('../config/database');
    const lessonId = req.params.id;
    const userId = req.user.userId;

    // Verify lesson exists via raw SQL (Prisma Client no longer has a Lesson model)
    const lessonRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "lessons" WHERE id = ${lessonId} AND "deletedAt" IS NULL LIMIT 1
    `;
    if (lessonRows.length === 0) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Lesson not found');
    }

    const now = new Date();

    // Upsert lesson_progress and recently_viewed via raw SQL (models removed from schema)
    await prisma.$executeRaw`
      INSERT INTO "lesson_progress" ("id", "userId", "lessonId", "completed", "watchPercentage", "timeSpent", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${userId}, ${lessonId}, false, 0, 0, ${now}, ${now})
      ON CONFLICT ("userId", "lessonId") DO UPDATE SET "updatedAt" = ${now}
    `;

    await prisma.$executeRaw`
      INSERT INTO "recently_viewed" ("id", "userId", "lessonId", "viewedAt")
      VALUES (gen_random_uuid()::text, ${userId}, ${lessonId}, ${now})
      ON CONFLICT ("userId", "lessonId") DO UPDATE SET "viewedAt" = ${now}
    `;

    sendSuccess(res, 'Lesson started', null);
  } catch (error) {
    next(error);
  }
};
