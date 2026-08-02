/**
 * Quiz & Practice Routes
 *
 * Mounted as part of the /learning prefix so the full URLs become:
 *   GET  /api/learning/lessons/:id/practice
 *   GET  /api/learning/lessons/:id/quiz
 *   POST /api/learning/lessons/:id/quiz/submit
 *   POST /api/learning/lessons/:id/start
 *   GET  /api/learning/stats
 *
 * These match EXACTLY what the frontend learningService calls.
 */

import { Router } from 'express';
import {
  getPracticeQuestions,
  getQuizQuestions,
  submitQuiz,
  getLearningStats,
  markLessonStarted,
} from '../controllers/quiz.controller';
import { authenticate } from '../middlewares/authenticate.middleware';

const router = Router();

// Practice questions — public read (auth optional)
router.get('/lessons/:id/practice', getPracticeQuestions);

// Quiz questions — public read (auth optional)
router.get('/lessons/:id/quiz', getQuizQuestions);

// Quiz submission — must be authenticated
router.post('/lessons/:id/quiz/submit', authenticate, submitQuiz);

// Mark lesson started — must be authenticated
router.post('/lessons/:id/start', authenticate, markLessonStarted);

// Learning stats — must be authenticated
router.get('/stats', authenticate, getLearningStats);

export default router;
