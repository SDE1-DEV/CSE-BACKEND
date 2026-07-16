import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/task.controller';
import { createComment, getTaskComments } from '../controllers/team-comment.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
  getTasksQuerySchema,
} from '../validators/task.validator';
import { createCommentSchema, getCommentsQuerySchema } from '../validators/team-comment.validator';

const router = Router();

router.get('/', authenticate, requireStudent, validate(getTasksQuerySchema), getTasks);
router.post('/', authenticate, requireStudent, validate(createTaskSchema), createTask);
router.put('/:id', authenticate, requireStudent, validate(updateTaskSchema), updateTask);
router.delete('/:id', authenticate, requireStudent, validate(taskParamsSchema), deleteTask);

// Comments on tasks: POST /api/tasks/:id/comments  GET /api/tasks/:id/comments
router.post('/:id/comments', authenticate, requireStudent, validate(createCommentSchema), createComment);
router.get('/:id/comments', authenticate, validate(getCommentsQuerySchema), getTaskComments);

export default router;
