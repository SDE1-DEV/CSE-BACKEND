import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  getCourses,
  getCourse,
  getRoadmap,
  getRoadmapFlat,
  getCurrent,
  getDashboard,
  getContinueLearning,
  getContent,
  getNotes,
  updateProgress,
  startLesson,
  completeLesson,
  getProgressAll,
  getProgressByCourse,
} from '../controllers/learning-student.controller';
import {
  getContentByIdSchema,
  getNotesSchema,
  updateProgressSchema,
} from '../validators/learning-cms.validator';

const courseIdParamSchema = z.object({
  params: z.object({
    courseId: z.string({ required_error: 'Course ID is required' }).uuid('Invalid course ID format'),
  }),
});

const router = Router();

// ── Flat endpoints (no courseId) — match frontend calls ───────────────────────
// GET /learning/dashboard  — StudentLearningDashboard shape
// GET /learning/roadmap    — StudentRoadmap shape (flat, uses first published course)
// GET /learning/continue   — ContinueLearningResult shape

router.get('/dashboard', authenticate, requireStudent, getDashboard);
router.get('/roadmap', authenticate, requireStudent, getRoadmapFlat);
router.get('/continue', authenticate, requireStudent, getContinueLearning);

// ── Per-course endpoints ──────────────────────────────────────────────────────
router.get('/courses', authenticate, requireStudent, getCourses);
router.get('/courses/:courseId', authenticate, requireStudent, validate(courseIdParamSchema), getCourse);
router.get('/courses/:courseId/roadmap', authenticate, requireStudent, validate(courseIdParamSchema), getRoadmap);
router.get('/courses/:courseId/current', authenticate, requireStudent, validate(courseIdParamSchema), getCurrent);

// ── Content endpoints ─────────────────────────────────────────────────────────
router.get('/content/:id', authenticate, requireStudent, validate(getContentByIdSchema), getContent);
router.get('/content/:id/notes', authenticate, requireStudent, validate(getNotesSchema), getNotes);
// start/complete must come BEFORE /progress (more specific first)
router.post('/content/:id/start', authenticate, requireStudent, startLesson);
router.post('/content/:id/complete', authenticate, requireStudent, completeLesson);
router.post('/content/:id/progress', authenticate, requireStudent, validate(updateProgressSchema), updateProgress);
router.patch('/content/:id/progress', authenticate, requireStudent, validate(updateProgressSchema), updateProgress);

// ── Progress ──────────────────────────────────────────────────────────────────
router.get('/progress', authenticate, requireStudent, getProgressAll);
router.get('/progress/:courseId', authenticate, requireStudent, validate(courseIdParamSchema), getProgressByCourse);

export default router;
