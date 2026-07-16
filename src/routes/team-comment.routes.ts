import { Router } from 'express';
import { updateComment, deleteComment } from '../controllers/team-comment.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateCommentSchema, commentParamsSchema } from '../validators/team-comment.validator';

const router = Router();

// PUT /api/comments/:id
router.put('/:id', authenticate, requireStudent, validate(updateCommentSchema), updateComment);
// DELETE /api/comments/:id
router.delete('/:id', authenticate, requireStudent, validate(commentParamsSchema), deleteComment);

export default router;
