import { Router } from 'express';
import { createTemplate, updateTemplate, deleteTemplate } from '../controllers/code-template.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCodeTemplateSchema,
  updateCodeTemplateSchema,
  codeTemplateParamsSchema,
} from '../validators/code-template.validator';

const router = Router();

router.post('/', authenticate, requireAdmin, validate(createCodeTemplateSchema), createTemplate);
router.put('/:id', authenticate, requireAdmin, validate(updateCodeTemplateSchema), updateTemplate);
router.delete('/:id', authenticate, requireAdmin, validate(codeTemplateParamsSchema), deleteTemplate);

export default router;
