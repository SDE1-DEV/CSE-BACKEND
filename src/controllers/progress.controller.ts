import { Response, NextFunction, Request } from 'express';
import { Role } from '@prisma/client';
import { progressService } from '../services/progress.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';

// ── Roadmap slug-based endpoints ──────────────────────────────────────────────

export const getRoadmapBySlug = async (
  req: AuthenticatedRequest & Request<{ slug: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isAdmin = req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.MANAGER;
    const result = await progressService.getRoadmapBySlug(req.params.slug, isAdmin, req.user?.userId);
    sendSuccess(res, LEARNING_MESSAGES.ROADMAP_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getRoadmapModules = async (
  req: AuthenticatedRequest & Request<{ slug: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isAdmin = req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.MANAGER;
    const result = await progressService.getRoadmapModulesWithLessons(req.params.slug, isAdmin);
    sendSuccess(res, 'Modules fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getRoadmapLessons = async (
  req: AuthenticatedRequest & Request<{ slug: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const isAdmin = req.user?.role === Role.SUPER_ADMIN || req.user?.role === Role.MANAGER;
    const result = await progressService.getRoadmapLessons(req.params.slug, isAdmin);
    sendSuccess(res, LEARNING_MESSAGES.LESSONS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

// ── Bookmarks (body-based) ───────────────────────────────────────────────────

export const addBookmarkByBody = async (
  req: AuthenticatedRequest & Request<object, object, { lessonId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const { lessonId } = req.body ?? {};
    const result = await progressService.addBookmarkByBody(req.user.userId, lessonId);
    sendCreated(res, LEARNING_MESSAGES.BOOKMARK_ADDED, result);
  } catch (error) {
    next(error);
  }
};

export const removeBookmarkByBody = async (
  req: AuthenticatedRequest & Request<object, object, { lessonId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const { lessonId } = req.body ?? {};
    await progressService.removeBookmarkByBody(req.user.userId, lessonId);
    sendSuccess(res, LEARNING_MESSAGES.BOOKMARK_REMOVED, null);
  } catch (error) {
    next(error);
  }
};

// ── Progress endpoints ───────────────────────────────────────────────────────

export const getUserProgress = async (
  req: AuthenticatedRequest & Request<object, object, object, { roadmapId?: string; moduleId?: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const filters = {
      roadmapId: req.query.roadmapId,
      moduleId: req.query.moduleId,
    };
    const result = await progressService.getUserProgress(req.user.userId, filters);
    sendSuccess(res, LEARNING_MESSAGES.PROGRESS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const patchProgress = async (
  req: AuthenticatedRequest & Request<
    object,
    object,
    { lessonId: string; lastOpened?: string | Date; watchPercentage?: number }
  >,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const result = await progressService.patchProgress(req.user.userId, req.body ?? {});
    sendSuccess(res, LEARNING_MESSAGES.PROGRESS_UPDATED, result);
  } catch (error) {
    next(error);
  }
};

// ── Activity endpoint ────────────────────────────────────────────────────────

export const getActivity = async (
  req: AuthenticatedRequest & Request<object, object, object, { limit?: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const limit = parseInt(req.query.limit ?? '25', 10) || 25;
    const result = await progressService.getActivity(req.user.userId, limit);
    sendSuccess(res, 'Activity fetched successfully', result);
  } catch (error) {
    next(error);
  }
};
