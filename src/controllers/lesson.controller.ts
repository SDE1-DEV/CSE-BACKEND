import { Response, NextFunction, Request } from 'express';
import { lessonService } from '../services/lesson.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import {
  CreateLessonInput,
  UpdateLessonInput,
  UpdateProgressInput,
} from '../validators/lesson.validator';
import { AppError } from '../middlewares/error.middleware';

/**
 * @swagger
 * tags:
 *   name: Lessons
 *   description: Lesson management and progress tracking
 */

/**
 * @swagger
 * /api/lessons/{sectionId}:
 *   get:
 *     tags: [Lessons]
 *     summary: Get all lessons for a section
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lessons fetched successfully
 */
export const getLessonsBySection = async (
  req: AuthenticatedRequest & Request<{ sectionId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const lessons = await lessonService.getLessonsBySection(
      req.params.sectionId,
      req.user?.role,
    );
    sendSuccess(res, LEARNING_MESSAGES.LESSONS_FETCHED, lessons);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/lesson/{id}:
 *   get:
 *     tags: [Lessons]
 *     summary: Get a lesson by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lesson fetched successfully
 *       404:
 *         description: Lesson not found
 */
export const getLessonById = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const lesson = await lessonService.getLessonById(
      req.params.id,
      req.user?.userId,
      req.user?.role,
    );
    sendSuccess(res, LEARNING_MESSAGES.LESSON_FETCHED, lesson);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/lesson:
 *   post:
 *     tags: [Lessons]
 *     summary: Create a new lesson (Admin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Lesson created successfully
 */
export const createLesson = async (
  req: AuthenticatedRequest & Request<object, object, CreateLessonInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const lesson = await lessonService.createLesson(req.body);
    sendCreated(res, LEARNING_MESSAGES.LESSON_CREATED, lesson);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/lesson/{id}:
 *   put:
 *     tags: [Lessons]
 *     summary: Update a lesson (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 */
export const updateLesson = async (
  req: AuthenticatedRequest & Request<{ id: string }, object, UpdateLessonInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const lesson = await lessonService.updateLesson(req.params.id, req.body);
    sendSuccess(res, LEARNING_MESSAGES.LESSON_UPDATED, lesson);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/lesson/{id}:
 *   delete:
 *     tags: [Lessons]
 *     summary: Delete a lesson (Admin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lesson deleted successfully
 */
export const deleteLesson = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    await lessonService.deleteLesson(req.params.id);
    sendSuccess(res, LEARNING_MESSAGES.LESSON_DELETED, null);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/lesson/{id}/complete:
 *   post:
 *     tags: [Lessons]
 *     summary: Mark a lesson as complete
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lesson marked as complete
 */
export const markLessonComplete = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const progress = await lessonService.markComplete(req.params.id, req.user.userId);
    sendSuccess(res, LEARNING_MESSAGES.LESSON_COMPLETED, progress);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/lesson/{id}/progress:
 *   patch:
 *     tags: [Lessons]
 *     summary: Update lesson progress (watchPercentage, timeSpent)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [watchPercentage, timeSpent]
 *             properties:
 *               watchPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               timeSpent:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Progress updated successfully
 */
export const updateLessonProgress = async (
  req: AuthenticatedRequest & Request<{ id: string }, object, UpdateProgressInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const progress = await lessonService.updateProgress(req.params.id, req.user.userId, req.body);
    sendSuccess(res, LEARNING_MESSAGES.PROGRESS_UPDATED, progress);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/bookmark/{lessonId}:
 *   post:
 *     tags: [Lessons]
 *     summary: Bookmark a lesson
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Lesson bookmarked successfully
 *       409:
 *         description: Already bookmarked
 */
export const addBookmark = async (
  req: AuthenticatedRequest & Request<{ lessonId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const result = await lessonService.addBookmark(req.params.lessonId, req.user.userId);
    sendSuccess(res, result.isBookmarked ? LEARNING_MESSAGES.BOOKMARK_ADDED : LEARNING_MESSAGES.BOOKMARK_REMOVED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/bookmark/{lessonId}:
 *   delete:
 *     tags: [Lessons]
 *     summary: Remove a bookmark
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Bookmark removed successfully
 *       404:
 *         description: Bookmark not found
 */
export const removeBookmark = async (
  req: AuthenticatedRequest & Request<{ lessonId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    await lessonService.removeBookmark(req.params.lessonId, req.user.userId);
    sendSuccess(res, LEARNING_MESSAGES.BOOKMARK_REMOVED, null);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/bookmarks:
 *   get:
 *     tags: [Lessons]
 *     summary: Get all bookmarked lessons for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bookmarks fetched successfully
 */
export const getBookmarks = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const bookmarks = await lessonService.getUserBookmarks(req.user.userId);
    sendSuccess(res, LEARNING_MESSAGES.BOOKMARKS_FETCHED, bookmarks);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/recent:
 *   get:
 *     tags: [Lessons]
 *     summary: Get recently viewed lessons
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Recently viewed lessons fetched successfully
 */
export const getRecentlyViewed = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const recent = await lessonService.getRecentlyViewed(req.user.userId);
    sendSuccess(res, LEARNING_MESSAGES.RECENTLY_VIEWED_FETCHED, recent);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/learning/continue:
 *   get:
 *     tags: [Lessons]
 *     summary: Get the most recently viewed incomplete lesson (Continue Learning)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Continue learning lesson fetched successfully
 */
export const getContinueLearning = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    }
    const result = await lessonService.getContinueLearning(req.user.userId);
    sendSuccess(res, LEARNING_MESSAGES.CONTINUE_LEARNING_FETCHED, result);
  } catch (error) {
    next(error);
  }
};
