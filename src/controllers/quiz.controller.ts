/**
 * Quiz & Practice Questions Controller
 * Handles:
 *   GET  /learning/lessons/:id/practice        → getPracticeQuestions
 *   GET  /learning/lessons/:id/quiz            → getQuizQuestions
 *   POST /learning/lessons/:id/quiz/submit     → submitQuiz
 *   GET  /learning/stats                       → getLearningStats
 *   POST /learning/lessons/:id/start           → markLessonStarted
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

    // Verify lesson exists first
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Lesson not found');
    }

    // Single upsert for progress + single upsert for recently viewed (parallel)
    await Promise.all([
      prisma.userProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: { lastOpened: new Date() },
        create: { userId, lessonId, completed: false, lastOpened: new Date() },
      }),
      prisma.recentlyViewed.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: { viewedAt: new Date() },
        create: { userId, lessonId },
      }),
    ]);

    sendSuccess(res, 'Lesson started', null);
  } catch (error) {
    next(error);
  }
};
