import { Router } from 'express';
import {
  getProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  addTagToProblem,
  removeTagFromProblem,
  addCompanyToProblem,
  removeCompanyFromProblem,
} from '../controllers/coding-problem.controller';
import { getTestCases } from '../controllers/test-case.controller';
import { getTemplates } from '../controllers/code-template.controller';
import { getSubmissionsByProblem } from '../controllers/submission.controller';
import { addFavorite, removeFavorite } from '../controllers/favorite.controller';
import { getDiscussions, createDiscussion } from '../controllers/discussion.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireManager, requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCodingProblemSchema,
  updateCodingProblemSchema,
  codingProblemParamsSchema,
  getProblemsQuerySchema,
} from '../validators/coding-problem.validator';
import { createDiscussionSchema, getDiscussionsQuerySchema } from '../validators/discussion.validator';

const router = Router();

// ── Problem CRUD ───────────────────────────────────────────────────────────────
router.get('/', authenticate, validate(getProblemsQuerySchema), getProblems);
router.get('/:id', validate(codingProblemParamsSchema), getProblemById);
router.post('/', authenticate, requireManager, validate(createCodingProblemSchema), createProblem);
router.put('/:id', authenticate, requireManager, validate(updateCodingProblemSchema), updateProblem);
router.delete('/:id', authenticate, requireManager, validate(codingProblemParamsSchema), deleteProblem);

// ── Tag & Company M2M ──────────────────────────────────────────────────────────
router.post('/:id/tags/:tagId', authenticate, requireManager, addTagToProblem);
router.delete('/:id/tags/:tagId', authenticate, requireManager, removeTagFromProblem);
router.post('/:id/companies/:companyId', authenticate, requireManager, addCompanyToProblem);
router.delete('/:id/companies/:companyId', authenticate, requireManager, removeCompanyFromProblem);

// ── Nested Resources ───────────────────────────────────────────────────────────
router.get('/:id/testcases', authenticate, getTestCases);
router.get('/:id/templates', getTemplates);
router.get('/:id/submissions', authenticate, requireStudent, getSubmissionsByProblem);

// ── Favorites ──────────────────────────────────────────────────────────────────
router.post('/:id/favorite', authenticate, requireStudent, addFavorite);
router.delete('/:id/favorite', authenticate, requireStudent, removeFavorite);

// ── Discussions ────────────────────────────────────────────────────────────────
router.get('/:id/discussions', validate(getDiscussionsQuerySchema), getDiscussions);
router.post(
  '/:id/discussions',
  authenticate,
  requireStudent,
  validate(createDiscussionSchema),
  createDiscussion,
);

export default router;
