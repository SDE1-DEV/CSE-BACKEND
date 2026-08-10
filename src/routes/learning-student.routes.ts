import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  getCourses,
  getCourse,
  getRoadmap,
  getCurrent,
  getDashboard,
  getContent,
  getNotes,
  updateProgress,
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

router.get('/courses', authenticate, requireStudent, getCourses);
router.get('/dashboard', authenticate, requireStudent, getDashboard);
router.get('/courses/:courseId', authenticate, requireStudent, validate(courseIdParamSchema), getCourse);
router.get('/courses/:courseId/roadmap', authenticate, requireStudent, validate(courseIdParamSchema), getRoadmap);
router.get('/courses/:courseId/current', authenticate, requireStudent, validate(courseIdParamSchema), getCurrent);
router.get('/content/:id', authenticate, requireStudent, validate(getContentByIdSchema), getContent);
router.get('/content/:id/notes', authenticate, requireStudent, validate(getNotesSchema), getNotes);
router.post('/content/:id/progress', authenticate, requireStudent, validate(updateProgressSchema), updateProgress);
router.get('/progress', authenticate, requireStudent, getProgressAll);
router.get('/progress/:courseId', authenticate, requireStudent, validate(courseIdParamSchema), getProgressByCourse);

export default router;
