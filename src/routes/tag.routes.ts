import { Router } from 'express';
import { getTags, getTagById, createTag, updateTag, deleteTag } from '../controllers/tag.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createTagSchema, updateTagSchema, tagParamsSchema } from '../validators/tag.validator';

const router = Router();

router.get('/', getTags);
router.get('/:id', validate(tagParamsSchema), getTagById);
router.post('/', authenticate, requireManager, validate(createTagSchema), createTag);
router.put('/:id', authenticate, requireManager, validate(updateTagSchema), updateTag);
router.delete('/:id', authenticate, requireManager, validate(tagParamsSchema), deleteTag);

export default router;
