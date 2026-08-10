import { Response, NextFunction } from 'express';
import { LearningProgressStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';
import { studentService } from '../services/learning-cms/student.service';
import { contentService } from '../services/learning-cms/content.service';
import { HTTP_STATUS, LEARNING_CMS_MESSAGES } from '../constants';
import { sendSuccess } from '../utils/response';

// ── Courses ───────────────────────────────────────────────────────────────────

export const getCourses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await studentService.getStudentCourses(req.user!.userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.COURSES_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await studentService.getStudentCourse(req.params.courseId, req.user!.userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.COURSE_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

// ── Roadmap ───────────────────────────────────────────────────────────────────

/**
 * GET /learning/courses/:courseId/roadmap
 * Full roadmap for a specific course (levels + contents + per-content progress).
 */
export const getRoadmap = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await studentService.getStudentRoadmap(req.params.courseId, req.user!.userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.ROADMAP_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /learning/roadmap  (flat — no courseId)
 * Uses the first published course. Returns the StudentRoadmap shape the
 * frontend useStudentRoadmap hook expects.
 */
export const getRoadmapFlat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await studentService.getStudentRoadmapFlat(req.user!.userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.ROADMAP_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

// ── Current / Dashboard ───────────────────────────────────────────────────────

export const getCurrent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    try {
      const result = await studentService.getCurrentLearning(req.params.courseId, req.user!.userId);
      sendSuccess(res, LEARNING_CMS_MESSAGES.CURRENT_LESSON_FETCHED, result);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err as { statusCode?: number }).statusCode === HTTP_STATUS.NOT_FOUND &&
        err.message.includes('No learning content')
      ) {
        sendSuccess(res, 'No learning content yet', {
          activeCourse: null,
          currentLevel: null,
          currentDay: null,
          currentTopic: null,
          continueLearningContent: null,
          nextContent: null,
          progress: { completedDays: 0, totalDays: 0, progressPercentage: 0 },
        });
        return;
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /learning/dashboard
 * Returns StudentLearningDashboard shape using the new CMS models.
 */
export const getDashboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await studentService.getStudentDashboardNew(req.user!.userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.DASHBOARD_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /learning/continue
 * Returns ContinueLearningResult | null. Never 500s on empty data.
 */
export const getContinueLearning = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await studentService.getStudentContinueLearning(req.user!.userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTINUE_LEARNING_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

// ── Content ───────────────────────────────────────────────────────────────────

export const getContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await studentService.getContentForStudent(req.params.id, req.user!.userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENT_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getNotes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await contentService.getContentById(req.params.id, false);
    const result = await contentService.getNotes(req.params.id);
    sendSuccess(res, LEARNING_CMS_MESSAGES.NOTES_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

// ── Progress ──────────────────────────────────────────────────────────────────

export const updateProgress = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await studentService.updateProgress(
      req.params.id,
      req.user!.userId,
      req.body.status,
    );
    sendSuccess(res, LEARNING_CMS_MESSAGES.PROGRESS_UPDATED, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /learning/content/:id/start
 * Marks the content IN_PROGRESS. Returns the LearningProgress record.
 */
export const startLesson = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await studentService.updateProgress(
      req.params.id,
      req.user!.userId,
      LearningProgressStatus.IN_PROGRESS,
    );
    sendSuccess(res, 'Lesson started', result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /learning/content/:id/complete
 * Marks the content COMPLETED. Returns LessonCompletionResult shape.
 */
export const completeLesson = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const contentId = req.params.id;

    // Mark completed
    await studentService.updateProgress(contentId, userId, LearningProgressStatus.COMPLETED);

    // Fetch current content metadata
    const current = await prisma.learningContent.findUnique({
      where: { id: contentId },
      select: { courseId: true, order: true, dayNumber: true, levelId: true },
    });

    let nextContent: Record<string, unknown> | null = null;
    let completedCount = 0;
    let totalCount = 0;

    if (current) {
      const [next, total, completed] = await Promise.all([
        prisma.learningContent.findFirst({
          where: {
            courseId: current.courseId,
            published: true,
            OR: [
              { order: { gt: current.order } },
              { order: current.order, dayNumber: { gt: current.dayNumber } },
            ],
            NOT: { id: contentId },
          },
          orderBy: [{ order: 'asc' }, { dayNumber: 'asc' }],
          include: { level: { select: { id: true, title: true, levelNumber: true } } },
        }),
        prisma.learningContent.count({ where: { courseId: current.courseId, published: true } }),
        prisma.learningProgress.count({
          where: {
            userId,
            courseId: current.courseId,
            status: LearningProgressStatus.COMPLETED,
          },
        }),
      ]);

      totalCount = total;
      completedCount = completed;

      if (next) {
        const nextLevel = (next as typeof next & { level?: { levelNumber: number } }).level;
        nextContent = {
          id: next.id,
          levelId: next.levelId,
          levelNumber: nextLevel?.levelNumber ?? 0,
          dayNumber: next.dayNumber,
          topicName: next.topicName,
          description: next.description,
          reelUrl: next.reelUrl,
          youtubeUrl: next.youtubeUrl ?? null,
          status: next.published ? 'PUBLISHED' : 'DRAFT',
          publishedAt: next.publishedAt,
          progressStatus: null,
        };
      }
    }

    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    sendSuccess(res, 'Lesson completed', {
      completed: true,
      completedContent: { id: contentId },
      nextContent,
      progress: { completed: completedCount, total: totalCount, percentage },
    });
  } catch (error) {
    next(error);
  }
};

export const getProgressAll = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await studentService.getProgress(req.user!.userId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.PROGRESS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};

export const getProgressByCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await studentService.getProgress(req.user!.userId, req.params.courseId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.PROGRESS_FETCHED, result);
  } catch (error) {
    next(error);
  }
};
