import { Router } from 'express';
import { updateDiscussion, deleteDiscussion } from '../controllers/discussion.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { updateDiscussionSchema, discussionParamsSchema } from '../validators/discussion.validator';

const router = Router();

router.put('/:id', authenticate, requireStudent, validate(updateDiscussionSchema), updateDiscussion);
router.delete('/:id', authenticate, requireStudent, validate(discussionParamsSchema), deleteDiscussion);

export default router;
