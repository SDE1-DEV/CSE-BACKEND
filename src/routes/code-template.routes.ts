import { Router } from 'express';
import { createTemplate, updateTemplate, deleteTemplate } from '../controllers/code-template.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCodeTemplateSchema,
  updateCodeTemplateSchema,
  codeTemplateParamsSchema,
} from '../validators/code-template.validator';

const router = Router();

router.post('/', authenticate, requireManager, validate(createCodeTemplateSchema), createTemplate);
router.put('/:id', authenticate, requireManager, validate(updateCodeTemplateSchema), updateTemplate);
router.delete('/:id', authenticate, requireManager, validate(codeTemplateParamsSchema), deleteTemplate);

export default router;
