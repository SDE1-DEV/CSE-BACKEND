/**
 * Learning API Routes — /api/learning/*
 *
 * Single source of truth for all endpoints the frontend learningService.ts calls.
 * Every route below matches EXACTLY the axios paths in the frontend.
 */

import { Router, Request, Response, NextFunction } from 'express';

import {
  getRoadmapBySlug,
  getRoadmapModules,
  getUserProgress,
} from '../controllers/progress.controller';
import {
  getLessonById,
  markLessonComplete,
  updateLessonProgress,
  getBookmarks,
  getRecentlyViewed,
  addBookmark,
  removeBookmark,
} from '../controllers/lesson.controller';
import {
  getNoteForLesson,
  createOrReplaceNote,
  updateNote,
  deleteNote,
} from '../controllers/note.controller';
import {
  getPracticeQuestions,
  getQuizQuestions,
  submitQuiz,
  getLearningStats,
  markLessonStarted,
} from '../controllers/quiz.controller';
import { globalSearch } from '../controllers/search.controller';
import { categoryService } from '../services/category.service';
import { resourceService } from '../services/resource.service';
import { lessonService } from '../services/lesson.service';
import { roadmapService } from '../services/roadmap.service';
import { sendSuccess, buildPaginated } from '../utils/response';
import { LEARNING_MESSAGES } from '../constants';
import { prisma } from '../config/database';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { lessonParamsSchema, updateProgressSchema } from '../validators/lesson.validator';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// Frontend expects: LearningCategory[]  (flat array, not paginated)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = (req as any).user?.role === 'SUPER_ADMIN' || (req as any).user?.role === 'MANAGER';
    const { search } = req.query as { search?: string };
    const result = await categoryService.getCategories(
      { search, page: 1, limit: 100 } as any,
      isAdmin,
    );
    const enriched = result.data.map((c: any) => ({
      ...c,
      name: c.title,
      color: '#3b82f6',
      roadmapCount: 0,
    }));
    sendSuccess(res, LEARNING_MESSAGES.CATEGORIES_FETCHED, enriched);
  } catch (err) {
    next(err);
  }
});

router.get('/categories/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cat = await categoryService.getCategoryBySlug(req.params.slug);
    sendSuccess(res, LEARNING_MESSAGES.CATEGORY_FETCHED, {
      ...cat,
      name: (cat as any).title,
      color: '#3b82f6',
      roadmapCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

// GET /learning/categories/:categoryId/roadmaps
// Called by learningService.getRoadmapsByCategory()
router.get('/categories/:categoryId/roadmaps', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin =
      (req as any).user?.role === 'SUPER_ADMIN' || (req as any).user?.role === 'MANAGER';
    const { page = '1', limit = '10' } = req.query as { page?: string; limit?: string };
    const result = await roadmapService.getRoadmaps(
      { categoryId: req.params.categoryId, page: parseInt(page, 10), limit: parseInt(limit, 10) } as any,
      isAdmin,
    );
    const enriched = result.data.map((r: any) => ({
      ...r,
      difficulty: r.difficulty?.toLowerCase() ?? 'beginner',
      estimatedHours: r.estimatedHours ?? 0,
      lessonCount: 0,
      tags: r.tags ? r.tags.split(',').map((t: string) => t.trim()) : [],
      category: r.category
        ? { ...r.category, name: r.category.title, color: '#3b82f6', roadmapCount: 0 }
        : null,
      progress: 0,
      completedLessons: 0,
    }));
    sendSuccess(res, LEARNING_MESSAGES.ROADMAPS_FETCHED, buildPaginated(enriched, result.total, result.page, result.limit));
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROADMAPS
// NOTE: more-specific routes (:slug/modules) must come BEFORE :slug
// ─────────────────────────────────────────────────────────────────────────────
router.get('/roadmaps', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin =
      (req as any).user?.role === 'SUPER_ADMIN' || (req as any).user?.role === 'MANAGER';
    const result = await roadmapService.getRoadmaps(req.query as any, isAdmin);
    const userId = (req as any).user?.userId as string | undefined;

    // Batch-fetch lesson counts using raw SQL (prisma.lesson is not in schema)
    const roadmapIds = result.data.map((r: any) => r.id);
    const lessonCounts: Record<string, number> = {};
    if (roadmapIds.length > 0) {
      try {
        const rows = await prisma.$queryRaw<{ roadmap_id: string; cnt: bigint }[]>`
          SELECT rs."roadmapId" AS roadmap_id, COUNT(l.id) AS cnt
          FROM "lessons"          l
          JOIN "roadmap_sections" rs ON rs.id = l."sectionId"
          WHERE rs."roadmapId" = ANY(${roadmapIds})
            AND l."deletedAt"  IS NULL
            AND rs."deletedAt" IS NULL
            ${isAdmin ? prisma.$queryRaw`` : prisma.$queryRaw`AND l."isPublished" = true`}
          GROUP BY rs."roadmapId"
        `;
        for (const r of rows) {
          lessonCounts[r.roadmap_id] = Number(r.cnt);
        }
      } catch {
        // table may not exist — lessonCounts stays empty
      }
    }

    // Batch-fetch per-user progress percentages if authenticated
    const progressMap: Record<string, { pct: number; completed: number }> = {};
    if (userId && roadmapIds.length > 0) {
      try {
        const completedRows = await prisma.$queryRaw<{ roadmap_id: string; cnt: bigint }[]>`
          SELECT rs."roadmapId" AS roadmap_id, COUNT(lp.id) AS cnt
          FROM "lesson_progress"  lp
          JOIN "lessons"          l  ON l.id  = lp."lessonId"  AND l."deletedAt"  IS NULL
          JOIN "roadmap_sections" rs ON rs.id = l."sectionId"  AND rs."deletedAt" IS NULL
          WHERE lp."userId"    = ${userId}
            AND rs."roadmapId" = ANY(${roadmapIds})
            AND lp.completed   = true
          GROUP BY rs."roadmapId"
        `;
        const completedByRoadmap: Record<string, number> = {};
        for (const r of completedRows) {
          completedByRoadmap[r.roadmap_id] = Number(r.cnt);
        }
        for (const rid of roadmapIds) {
          const total = lessonCounts[rid] ?? 0;
          const done = completedByRoadmap[rid] ?? 0;
          progressMap[rid] = {
            pct: total > 0 ? Math.round((done / total) * 100) : 0,
            completed: done,
          };
        }
      } catch {
        // lesson_progress may not exist — progressMap stays empty
      }
    }

    const enriched = result.data.map((r: any) => ({
      ...r,
      difficulty: r.difficulty?.toLowerCase() ?? 'beginner',
      estimatedHours: r.estimatedHours ?? 0,
      lessonCount: lessonCounts[r.id] ?? 0,
      tags: r.tags ? r.tags.split(',').map((t: string) => t.trim()) : [],
      category: r.category
        ? { ...r.category, name: r.category.title, color: '#3b82f6', roadmapCount: 0 }
        : { id: '', name: 'Programming', slug: 'programming', color: '#3b82f6', roadmapCount: 0 },
      progress: progressMap[r.id]?.pct ?? 0,
      completedLessons: progressMap[r.id]?.completed ?? 0,
    }));

    sendSuccess(res, LEARNING_MESSAGES.ROADMAPS_FETCHED, buildPaginated(enriched, result.total, result.page, result.limit));
  } catch (err) {
    next(err);
  }
});

// Must come BEFORE /roadmaps/:slug
router.get('/roadmaps/:slug/modules', getRoadmapModules);

// Full roadmap detail with enriched sections + progress for authenticated user
router.get('/roadmaps/:slug', getRoadmapBySlug);

// Roadmap bookmark toggle (lightweight stub — returns toggle state)
router.post('/roadmaps/:id/bookmark', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    // Check if we have a first published lesson for this roadmap — use raw SQL
    const firstLessonRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT l.id
      FROM "lessons"          l
      JOIN "roadmap_sections" rs ON rs.id = l."sectionId"
      WHERE rs."roadmapId"  = ${req.params.id}
        AND rs."deletedAt"  IS NULL
        AND l."deletedAt"   IS NULL
        AND l."isPublished" = true
      ORDER BY rs."order" ASC, l."order" ASC
      LIMIT 1
    `.catch(() => [] as { id: string }[]);

    if (firstLessonRows.length > 0) {
      const result = await lessonService.addBookmark(firstLessonRows[0].id, userId);
      sendSuccess(res, 'Roadmap bookmark toggled', { isBookmarked: result.isBookmarked });
    } else {
      sendSuccess(res, 'Roadmap bookmark toggled', { isBookmarked: true });
    }
  } catch (err) {
    next(err);
  }
});

router.get('/roadmaps/:roadmapId/progress', authenticate, requireStudent, getUserProgress);

// ─────────────────────────────────────────────────────────────────────────────
// RESOURCES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/resources/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resource = await resourceService.getResourceById(req.params.id);
    sendSuccess(res, LEARNING_MESSAGES.RESOURCES_FETCHED, resource);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LESSONS — most-specific subroutes FIRST, then base :id
// Order matters: quiz/submit > quiz > practice > complete > start > progress
//                > resources > bookmark > notes/* > base :id
// ─────────────────────────────────────────────────────────────────────────────

// Quiz submit (must be before plain /quiz GET)
router.post('/lessons/:id/quiz/submit', authenticate, submitQuiz);

// Quiz questions (GET)
router.get('/lessons/:id/quiz', getQuizQuestions);

// Practice questions (GET)
router.get('/lessons/:id/practice', getPracticeQuestions);

// Complete
router.post('/lessons/:id/complete', authenticate, validate(lessonParamsSchema), markLessonComplete);

// Start / mark opened
router.post('/lessons/:id/start', authenticate, markLessonStarted);

// Progress update
router.patch('/lessons/:id/progress', authenticate, validate(updateProgressSchema), updateLessonProgress);

// Resources for a lesson
router.get('/lessons/:id/resources', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resources = await resourceService.getResourcesByLesson(req.params.id);
    sendSuccess(res, LEARNING_MESSAGES.RESOURCES_FETCHED, resources);
  } catch (err) {
    next(err);
  }
});

// Bookmark toggle (POST = toggle, DELETE = force-remove)
router.post('/lessons/:id/bookmark', authenticate, (req: Request, res: Response, next: NextFunction) => {
  (req.params as Record<string, string>).lessonId = req.params.id;
  return addBookmark(req as any, res, next);
});
router.delete('/lessons/:id/bookmark', authenticate, (req: Request, res: Response, next: NextFunction) => {
  (req.params as Record<string, string>).lessonId = req.params.id;
  return removeBookmark(req as any, res, next);
});

// Notes (with and without :noteId — backend upserts by userId+lessonId)
router.get('/lessons/:id/notes', authenticate, requireStudent, getNoteForLesson);
router.post('/lessons/:id/notes', authenticate, requireStudent, createOrReplaceNote);
router.patch('/lessons/:id/notes/:noteId', authenticate, requireStudent, updateNote);
router.patch('/lessons/:id/notes', authenticate, requireStudent, updateNote);
router.delete('/lessons/:id/notes/:noteId', authenticate, requireStudent, deleteNote);
router.delete('/lessons/:id/notes', authenticate, requireStudent, deleteNote);

// Base lesson fetch (MUST be last for :id routes to avoid swallowing sub-routes)
router.get('/lessons/:id', validate(lessonParamsSchema), getLessonById);

// ─────────────────────────────────────────────────────────────────────────────
// BOOKMARKS (generic — frontend also calls these for add/remove/list)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/bookmarks', authenticate, getBookmarks);

router.post('/bookmarks', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const { itemId } = req.body ?? {};
    if (!itemId) { res.status(400).json({ success: false, message: 'itemId is required' }); return; }
    const result = await lessonService.addBookmark(itemId, userId);
    sendSuccess(
      res,
      result.isBookmarked ? LEARNING_MESSAGES.BOOKMARK_ADDED : LEARNING_MESSAGES.BOOKMARK_REMOVED,
      result,
    );
  } catch (err) {
    next(err);
  }
});

router.delete('/bookmarks/:bookmarkId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    // Use raw SQL — prisma.bookmark is not in schema
    const bm = await prisma.$queryRaw<{ id: string; userId: string }[]>`
      SELECT id, "userId" FROM "bookmarks" WHERE id = ${req.params.bookmarkId} LIMIT 1
    `;
    if (bm.length === 0 || bm[0].userId !== userId) {
      res.status(404).json({ success: false, message: LEARNING_MESSAGES.BOOKMARK_NOT_FOUND });
      return;
    }
    await prisma.$executeRaw`DELETE FROM "bookmarks" WHERE id = ${req.params.bookmarkId}`;
    sendSuccess(res, LEARNING_MESSAGES.BOOKMARK_REMOVED, null);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RECENT / STATS
// NOTE: /continue, /dashboard, /roadmap are handled by learning-student.routes.ts
//       which is mounted BEFORE this router in routes/index.ts.
//       Do NOT re-register them here to avoid the legacy getContinueLearning
//       (which used prisma.recentlyViewed) shadowing the new CMS endpoint.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/recent', authenticate, getRecentlyViewed);
router.get('/stats', authenticate, getLearningStats);

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH  GET /learning/search?q=...
// ─────────────────────────────────────────────────────────────────────────────
router.get('/search', globalSearch);

export default router;
