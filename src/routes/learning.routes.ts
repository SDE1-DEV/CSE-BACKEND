import { Router } from 'express';
import {
  getRoadmapBySlug,
  getRoadmapModules,
  getRoadmapLessons,
  addBookmarkByBody,
  removeBookmarkByBody,
  getUserProgress,
  patchProgress,
  getActivity,
} from '../controllers/progress.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';

const router = Router();

// ── Slug-based Roadmap routes (public or optional auth via controllers) ──────
router.get('/roadmaps/:slug', getRoadmapBySlug);
router.get('/roadmaps/:slug/modules', getRoadmapModules);
router.get('/roadmaps/:slug/lessons', getRoadmapLessons);

// ── Bookmarks (body-based variant) ───────────────────────────────────────────
router.post('/bookmark', authenticate, requireStudent, addBookmarkByBody);
router.delete('/bookmark', authenticate, requireStudent, removeBookmarkByBody);

// ── Learning Progress ────────────────────────────────────────────────────────
router.get('/progress', authenticate, requireStudent, getUserProgress);
router.patch('/progress', authenticate, requireStudent, patchProgress);

// ── Recent Activity ──────────────────────────────────────────────────────────
router.get('/activity', authenticate, requireStudent, getActivity);

export default router;
