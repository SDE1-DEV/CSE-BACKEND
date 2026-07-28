import { Router } from 'express';
import {
  getLessonsBySection,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  markLessonComplete,
  updateLessonProgress,
  addBookmark,
  removeBookmark,
  getBookmarks,
  getRecentlyViewed,
  getContinueLearning,
} from '../controllers/lesson.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createLessonSchema,
  updateLessonSchema,
  lessonParamsSchema,
  lessonsBySectionSchema,
  updateProgressSchema,
} from '../validators/lesson.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Lessons
 *   description: Lesson management and student learning features
 */

// ── CRUD (lesson plural for list, singular for item) ────────────────────────

// GET /api/lessons/:sectionId  — list lessons for a section
router.get('/lessons/:sectionId', validate(lessonsBySectionSchema), getLessonsBySection);

// GET /api/lesson/:id  — get single lesson (tracks recently viewed if authenticated)
router.get('/lesson/:id', validate(lessonParamsSchema), getLessonById);

// Admin: create / update / delete
router.post('/lesson', authenticate, requireManager, validate(createLessonSchema), createLesson);
router.put('/lesson/:id', authenticate, requireManager, validate(updateLessonSchema), updateLesson);
router.delete('/lesson/:id', authenticate, requireManager, validate(lessonParamsSchema), deleteLesson);

// ── Student Progress ─────────────────────────────────────────────────────────

router.post('/lesson/:id/complete', authenticate, validate(lessonParamsSchema), markLessonComplete);
router.patch('/lesson/:id/progress', authenticate, validate(updateProgressSchema), updateLessonProgress);

// ── Bookmarks ────────────────────────────────────────────────────────────────

router.post('/bookmark/:lessonId', authenticate, addBookmark);
router.delete('/bookmark/:lessonId', authenticate, removeBookmark);
router.get('/bookmarks', authenticate, getBookmarks);

// ── Recently Viewed ──────────────────────────────────────────────────────────

router.get('/recent', authenticate, getRecentlyViewed);

// ── Continue Learning ────────────────────────────────────────────────────────

router.get('/learning/continue', authenticate, getContinueLearning);

export default router;
