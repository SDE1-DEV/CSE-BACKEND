import { Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendCreated, sendError } from '../../utils/response';
import { HTTP_STATUS, LEARNING_CMS_MESSAGES } from '../../constants';
import { AuthenticatedRequest } from '../../types';
import { courseService } from '../../services/learning-cms/course.service';
import { levelService } from '../../services/learning-cms/level.service';
import { contentService } from '../../services/learning-cms/content.service';
import { AppError } from '../../middlewares/error.middleware';
import { storageService } from '../../services/learning-cms/storage.service';

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

/**
 * GET /admin/learning/levels — flat list of ALL levels across all courses.
 * Frontend calls this with ?includeInactive=true for level selects/lists.
 */
export const listAllLevels = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const { courseId } = req.query as { courseId?: string };

    const where: Record<string, unknown> = {};
    if (courseId) where['courseId'] = courseId;
    if (!includeInactive) {
      where['status'] = 'PUBLISHED';
    }

    const levels = await prisma.level.findMany({
      where,
      orderBy: [{ order: 'asc' }, { levelNumber: 'asc' }],
      include: {
        course: { select: { id: true, title: true, slug: true } },
        _count: { select: { contents: true } },
      },
    });

    // Map to the shape the frontend LearningLevel type expects:
    // { id, levelNumber, title, description, displayOrder (=order), isActive (status!==ARCHIVED), ... }
    const mapped = levels.map((lvl) => ({
      id: lvl.id,
      courseId: lvl.courseId,
      levelNumber: lvl.levelNumber,
      title: lvl.title,
      description: lvl.description,
      displayOrder: lvl.order,
      isActive: lvl.status !== 'ARCHIVED',
      status: lvl.status,
      youtubeUrl: lvl.youtubeUrl,
      course: (lvl as any).course,
      contentCount: (lvl as any)._count.contents,
      createdAt: lvl.createdAt,
      updatedAt: lvl.updatedAt,
    }));

    sendSuccess(res, LEARNING_CMS_MESSAGES.LEVELS_FETCHED, mapped);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /admin/learning/levels — create a level (courseId comes from body).
 */
export const createLevelFlat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { courseId, ...rest } = req.body as { courseId: string; [key: string]: unknown };

    if (!courseId) {
      sendError(res, 'courseId is required', HTTP_STATUS.BAD_REQUEST);
      return;
    }

    const data = await levelService.createLevel(courseId, rest as any, actorId);
    // Return with the same mapped shape as listAllLevels
    const mapped = {
      ...data,
      displayOrder: data.order,
      isActive: data.status !== 'ARCHIVED',
    };
    sendCreated(res, LEARNING_CMS_MESSAGES.LEVEL_CREATED, mapped);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /admin/learning/levels/:id — partial update (frontend uses PATCH).
 */
export const patchLevel = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { id } = req.params;

    // Map displayOrder → order if frontend sends displayOrder
    const body = { ...req.body };
    if (body.displayOrder !== undefined && body.order === undefined) {
      body.order = body.displayOrder;
      delete body.displayOrder;
    }
    // Map isActive → status if frontend sends isActive
    if (body.isActive !== undefined && body.status === undefined) {
      body.status = body.isActive ? 'PUBLISHED' : 'ARCHIVED';
      delete body.isActive;
    }

    const data = await levelService.updateLevel(id, body, actorId);
    const mapped = {
      ...data,
      displayOrder: data.order,
      isActive: data.status !== 'ARCHIVED',
    };
    sendSuccess(res, LEARNING_CMS_MESSAGES.LEVEL_UPDATED, mapped);
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
    const rawData = await contentService.getContentList(req.query as any, true);

    // Batch-fetch all level data in a single query (no N+1)
    const levelIds = [...new Set(rawData.data.map((item) => item.levelId))];
    const levels = levelIds.length > 0
      ? await prisma.level.findMany({
          where: { id: { in: levelIds } },
          select: { id: true, levelNumber: true, title: true },
        }).catch(() => [] as { id: string; levelNumber: number; title: string }[])
      : [] as { id: string; levelNumber: number; title: string }[];

    const levelMap = new Map(levels.map((l) => [l.id, l]));

    const enriched = rawData.data.map((item) => {
      const level = levelMap.get(item.levelId);
      return {
        ...item,
        status: item.published ? 'PUBLISHED' : 'DRAFT',
        levelNumber: level?.levelNumber ?? 0,
        levelTitle: level?.title ?? '',
        notes: (item as any).noteImages ?? [],
      };
    });

    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENTS_FETCHED, {
      ...rawData,
      data: enriched,
    });
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
    const item = await contentService.getContentById(id, true);

    const level = await prisma.level.findUnique({
      where: { id: item.levelId },
      select: { levelNumber: true, title: true },
    }).catch(() => null);

    const mapped = {
      ...item,
      status: item.published ? 'PUBLISHED' : 'DRAFT',
      levelNumber: level?.levelNumber ?? 0,
      levelTitle: level?.title ?? '',
      notes: (item as any).noteImages ?? [],
    };

    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENT_FETCHED, mapped);
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
    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENT_PUBLISHED, {
      ...data,
      status: 'PUBLISHED',
    });
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
    sendSuccess(res, LEARNING_CMS_MESSAGES.CONTENT_UNPUBLISHED, {
      ...data,
      status: 'UNPUBLISHED',
    });
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

    await contentService.uploadNote(
      id,
      {
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
      },
      noteOrder,
      actorId,
    );

    // Return ALL images for this content so the frontend can sync state
    const allImages = await contentService.getNotes(id);
    sendCreated(res, LEARNING_CMS_MESSAGES.NOTE_UPLOADED, { images: allImages });
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

/**
 * POST /admin/learning/content/bulk-status
 * Body: { ids: string[], status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' }
 */
export const bulkUpdateContentStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { ids, status } = req.body as { ids: string[]; status: string };

    // Map status string to the published boolean (and future archived flag)
    let published: boolean;
    if (status === 'PUBLISHED') {
      published = true;
    } else {
      // DRAFT or ARCHIVED both set published = false (archived is treated as unpublished)
      published = false;
    }

    const result = await prisma.learningContent.updateMany({
      where: { id: { in: ids } },
      data: {
        published,
        ...(published ? { publishedAt: new Date() } : {}),
      },
    });

    sendSuccess(res, `Bulk status updated to ${status}`, { updated: result.count });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /admin/learning/content/bulk-delete
 * Body: { ids: string[] }
 */
export const bulkDeleteContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const actorId = req.user!.userId;
    const { ids } = req.body as { ids: string[] };

    // Delete associated note images first to avoid orphaned storage objects
    const contents = await prisma.learningContent.findMany({
      where: { id: { in: ids } },
      include: { noteImages: true },
    });

    await prisma.$transaction(async (tx) => {
      // Delete note images from storage + DB
      for (const content of contents) {
        for (const note of content.noteImages) {
          try {
            await storageService.deleteNoteImage(note.storagePath);
          } catch {
            // Non-fatal: continue even if storage delete fails
          }
        }
      }

      await tx.learningContent.deleteMany({
        where: { id: { in: ids } },
      });
    });

    sendSuccess(res, 'Bulk delete successful', { deleted: ids.length });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /admin/learning/content/:id/archive
 */
export const archiveContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.learningContent.findUnique({ where: { id } });
    if (!existing) {
      sendError(res, 'Learning content not found', HTTP_STATUS.NOT_FOUND);
      return;
    }

    const data = await prisma.learningContent.update({
      where: { id },
      data: { published: false },
    });

    sendSuccess(res, 'Content archived successfully', {
      ...data,
      status: 'ARCHIVED',
    });
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
    // Run all summary queries in parallel — single round-trip
    const [
      totalCourses,
      totalLevels,
      publishedContent,
      draftContent,
      totalNotes,
      totalCompletedLessons,
    ] = await Promise.all([
      prisma.course.count().catch(() => 0),
      prisma.level.count().catch(() => 0),
      prisma.learningContent.count({ where: { published: true } }).catch(() => 0),
      prisma.learningContent.count({ where: { published: false } }).catch(() => 0),
      prisma.learningNoteImage.count().catch(() => 0),
      prisma.learningProgress.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
    ]);

    const totalContent = publishedContent + draftContent;

    // Current active day (most recently published)
    const latestPublished = await prisma.learningContent.findFirst({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      include: { level: { select: { levelNumber: true } } },
    }).catch(() => null);

    // Student engagement — two distinct-user counts
    const [studentsStarted, studentsCompletedAll] = await Promise.all([
      prisma.learningProgress.findMany({
        distinct: ['userId'],
        select: { userId: true },
      }).then((r) => r.length).catch(() => 0),
      prisma.learningProgress.groupBy({
        by: ['userId'],
        where: { status: 'COMPLETED' },
        _count: { id: true },
      }).then((r) => r.length).catch(() => 0),
    ]);

    // Level list
    const levels = await prisma.level.findMany({
      orderBy: [{ order: 'asc' }, { levelNumber: 'asc' }],
      select: { id: true, levelNumber: true, title: true },
    }).catch(() => [] as { id: string; levelNumber: number; title: string }[]);

    const levelIds = levels.map((l) => l.id);

    // Batch all level breakdown queries — one query per metric instead of 4×N
    const [contentTotals, contentPublished, progressStarted, progressCompleted] = levelIds.length > 0
      ? await Promise.all([
          prisma.learningContent.groupBy({
            by: ['levelId'],
            where: { levelId: { in: levelIds } },
            _count: { id: true },
          }).catch(() => [] as { levelId: string; _count: { id: number } }[]),

          prisma.learningContent.groupBy({
            by: ['levelId'],
            where: { levelId: { in: levelIds }, published: true },
            _count: { id: true },
          }).catch(() => [] as { levelId: string; _count: { id: number } }[]),

          // Students who have any progress for content in each level
          prisma.$queryRaw<{ level_id: string; cnt: bigint }[]>`
            SELECT lc."levelId" AS level_id, COUNT(DISTINCT lp."userId") AS cnt
            FROM "learning_progress" lp
            JOIN "learning_contents" lc ON lc.id = lp."contentId"
            WHERE lc."levelId" = ANY(${levelIds})
            GROUP BY lc."levelId"
          `.catch(() => [] as { level_id: string; cnt: bigint }[]),

          // Students who completed ALL content in each level (approximate: any COMPLETED)
          prisma.$queryRaw<{ level_id: string; cnt: bigint }[]>`
            SELECT lc."levelId" AS level_id, COUNT(DISTINCT lp."userId") AS cnt
            FROM "learning_progress" lp
            JOIN "learning_contents" lc ON lc.id = lp."contentId"
            WHERE lc."levelId" = ANY(${levelIds})
              AND lp.status = 'COMPLETED'
            GROUP BY lc."levelId"
          `.catch(() => [] as { level_id: string; cnt: bigint }[]),
        ])
      : [[], [], [], []];

    const totalMap = new Map((contentTotals as { levelId: string; _count: { id: number } }[]).map((r) => [r.levelId, r._count.id]));
    const pubMap = new Map((contentPublished as { levelId: string; _count: { id: number } }[]).map((r) => [r.levelId, r._count.id]));
    const startMap = new Map((progressStarted as { level_id: string; cnt: bigint }[]).map((r) => [r.level_id, Number(r.cnt)]));
    const compMap = new Map((progressCompleted as { level_id: string; cnt: bigint }[]).map((r) => [r.level_id, Number(r.cnt)]));

    const levelBreakdown = levels.map((lvl) => ({
      levelNumber: lvl.levelNumber,
      title: lvl.title,
      totalDays: totalMap.get(lvl.id) ?? 0,
      publishedDays: pubMap.get(lvl.id) ?? 0,
      studentsStarted: startMap.get(lvl.id) ?? 0,
      studentsCompleted: compMap.get(lvl.id) ?? 0,
    }));

    const completionRate = totalContent > 0 && studentsStarted > 0
      ? Math.round((totalCompletedLessons / (totalContent * studentsStarted)) * 100)
      : 0;

    sendSuccess(res, 'Learning CMS dashboard fetched successfully', {
      totalLevels,
      totalLearningDays: totalContent,
      publishedCount: publishedContent,
      draftsCount: draftContent,
      unpublishedCount: 0,
      archivedCount: 0,
      currentActiveDay: latestPublished ? {
        levelNumber: latestPublished.level.levelNumber,
        dayNumber: latestPublished.dayNumber,
        topicName: latestPublished.topicName,
      } : null,
      studentsStarted,
      studentsCompleted: studentsCompletedAll,
      totalCompletedLessons,
      completionRate,
      levelBreakdown,
      courses: { total: totalCourses, published: publishedContent, draft: draftContent },
      levels: { total: totalLevels },
      content: { total: totalContent, published: publishedContent, draft: draftContent },
      notes: { total: totalNotes },
    });
  } catch (error) {
    next(error);
  }
};
