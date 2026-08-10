import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendCreated, sendError } from '../../utils/response';
import { HTTP_STATUS, LEARNING_CMS_MESSAGES } from '../../constants';
import { AuthenticatedRequest } from '../../types';
import { courseService } from '../../services/learning-cms/course.service';
import { levelService } from '../../services/learning-cms/level.service';
import { contentService } from '../../services/learning-cms/content.service';

export const listCourses = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await courseService.getCourses(req.query, true);
    sendSuccess(res, LEARNING_CMS_MESSAGES.COURSES_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const data = await courseService.createCourse(req.body, actorId);
    sendCreated(res, LEARNING_CMS_MESSAGES.COURSE_CREATED, data);
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
    const data = await courseService.getCourseById(req.params.id, true);
    sendSuccess(res, LEARNING_CMS_MESSAGES.COURSE_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { id } = req.params;
    const data = await courseService.updateCourse(id, req.body, actorId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.COURSE_UPDATED, data);
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { id } = req.params;
    await courseService.deleteCourse(id, actorId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.COURSE_DELETED, null);
  } catch (error) {
    next(error);
  }
};

export const listLevels = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const data = await levelService.getLevelsByCourse(courseId, true);
    sendSuccess(res, LEARNING_CMS_MESSAGES.LEVELS_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

export const createLevel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { courseId } = req.params;
    const data = await levelService.createLevel(courseId, req.body, actorId);
    sendCreated(res, LEARNING_CMS_MESSAGES.LEVEL_CREATED, data);
  } catch (error) {
    next(error);
  }
};

export const updateLevel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { id } = req.params;
    const data = await levelService.updateLevel(id, req.body, actorId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.LEVEL_UPDATED, data);
  } catch (error) {
    next(error);
  }
};

export const deleteLevel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { id } = req.params;
    await levelService.deleteLevel(id, actorId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.LEVEL_DELETED, null);
  } catch (error) {
    next(error);
  }
};

export const reorderLevels = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    await levelService.reorderLevels(req.body.orders, actorId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.LEVELS_FETCHED, null);
  } catch (error) {
    next(error);
  }
};

export const listContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await contentService.getContentList(req.query, true);
    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENTS_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

export const createContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const data = await contentService.createContent(req.body, actorId);
    sendCreated(res, LEARNING_CMS_MESSAGES.CONTENT_CREATED, data);
  } catch (error) {
    next(error);
  }
};

export const getContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = await contentService.getContentById(id, true);
    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENT_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

export const updateContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { id } = req.params;
    const data = await contentService.updateContent(id, req.body, actorId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENT_UPDATED, data);
  } catch (error) {
    next(error);
  }
};

export const deleteContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { id } = req.params;
    await contentService.deleteContent(id, actorId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENT_DELETED, null);
  } catch (error) {
    next(error);
  }
};

export const publishContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { id } = req.params;
    const data = await contentService.publishContent(id, actorId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENT_PUBLISHED, data);
  } catch (error) {
    next(error);
  }
};

export const unpublishContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { id } = req.params;
    const data = await contentService.unpublishContent(id, actorId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENT_UNPUBLISHED, data);
  } catch (error) {
    next(error);
  }
};

export const reorderContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    await contentService.reorderContent(req.body.orders, actorId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENTS_FETCHED, null);
  } catch (error) {
    next(error);
  }
};

export const uploadNote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const actorId = req.user!.userId;
    const noteOrder = req.body.noteOrder ?? 0;

    if (!req.file) {
      sendError(res, 'File is required', HTTP_STATUS.BAD_REQUEST);
      return;
    }

    const data = await contentService.uploadNote(
      id,
      {
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
      },
      noteOrder,
      actorId,
    );
    sendCreated(res, LEARNING_CMS_MESSAGES.NOTE_UPLOADED, data);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { noteId } = req.params;
    await contentService.deleteNote(noteId, actorId);
    sendSuccess(res, LEARNING_CMS_MESSAGES.NOTE_DELETED, null);
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
    const { id } = req.params;
    const data = await contentService.getNotes(id);
    sendSuccess(res, LEARNING_CMS_MESSAGES.NOTES_FETCHED, data);
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      totalLevels,
      publishedLevels,
      totalContent,
      publishedContent,
      draftContent,
      totalNotes,
      todayContent,
      latestPublished,
    ] = await Promise.all([
      prisma.course.count(),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.course.count({ where: { status: 'DRAFT' } }),
      prisma.course.count({ where: { status: 'ARCHIVED' } }),
      prisma.level.count(),
      prisma.level.count({ where: { status: 'PUBLISHED' } }),
      prisma.learningContent.count(),
      prisma.learningContent.count({ where: { published: true } }),
      prisma.learningContent.count({ where: { published: false } }),
      prisma.learningNoteImage.count(),
      prisma.learningContent.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.learningContent.findMany({
        where: { published: true },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          topicName: true,
          dayNumber: true,
          publishedAt: true,
          course: { select: { id: true, title: true, slug: true } },
          level: { select: { id: true, title: true, levelNumber: true } },
        },
      }),
    ]);

    sendSuccess(res, 'Learning CMS dashboard fetched successfully', {
      courses: {
        total: totalCourses,
        published: publishedCourses,
        draft: draftCourses,
        archived: archivedCourses,
      },
      levels: {
        total: totalLevels,
        published: publishedLevels,
      },
      content: {
        total: totalContent,
        published: publishedContent,
        draft: draftContent,
        todayCount: todayContent,
      },
      notes: {
        total: totalNotes,
      },
      latestPublished,
    });
  } catch (error) {
    next(error);
  }
};
