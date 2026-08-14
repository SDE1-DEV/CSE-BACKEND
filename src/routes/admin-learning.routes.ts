import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireSuperAdmin } from '../middlewares/role.middleware';
import { auditAction } from '../middlewares/audit.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCourseSchema,
  updateCourseSchema,
  getCourseByIdSchema,
  createLevelSchema,
  updateLevelSchema,
  getLevelsByCourseSchema,
  reorderLevelsSchema,
  createContentSchema,
  updateContentSchema,
  getContentByIdSchema,
  listContentSchema,
  publishContentSchema,
  reorderContentSchema,
  uploadNoteSchema,
  deleteNoteSchema,
  getNotesSchema,
  bulkStatusSchema,
  bulkDeleteSchema,
} from '../validators/learning-cms.validator';
import {
  listCourses,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  listLevels,
  listAllLevels,
  createLevelFlat,
  patchLevel,
  createLevel,
  updateLevel,
  deleteLevel,
  reorderLevels,
  listContent,
  createContent,
  getContent,
  updateContent,
  deleteContent,
  publishContent,
  unpublishContent,
  archiveContent,
  reorderContent,
  bulkUpdateContentStatus,
  bulkDeleteContent,
  uploadNote,
  deleteNote,
  getNotes,
  getAdminDashboard,
} from '../controllers/admin/learning-admin.controller';
import { uploadLearningNoteImage } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/dashboard', getAdminDashboard);

router.get('/courses', listCourses);
router.post(
  '/courses',
  validate(createCourseSchema),
  auditAction({ action: 'COURSE_CREATED', module: 'LEARNING', entity: 'Course' }),
  createCourse,
);
router.get(
  '/courses/:id',
  validate(getCourseByIdSchema),
  getCourse,
);
router.put(
  '/courses/:id',
  validate(updateCourseSchema),
  auditAction({ action: 'COURSE_UPDATED', module: 'LEARNING', entity: 'Course' }),
  updateCourse,
);
router.delete(
  '/courses/:id',
  validate(getCourseByIdSchema),
  auditAction({ action: 'COURSE_DELETED', module: 'LEARNING', entity: 'Course' }),
  deleteCourse,
);

router.get(
  '/courses/:courseId/levels',
  validate(getLevelsByCourseSchema),
  listLevels,
);
router.post(
  '/courses/:courseId/levels',
  validate(createLevelSchema),
  auditAction({ action: 'LEVEL_CREATED', module: 'LEARNING', entity: 'Level' }),
  createLevel,
);

// ── Flat levels API (frontend-facing) ─────────────────────────────────────────
// GET  /admin/learning/levels            — list all levels (with ?includeInactive=true)
// POST /admin/learning/levels            — create a level (courseId in body)
// PATCH /admin/learning/levels/reorder   — reorder (MUST be before :id)
// PATCH /admin/learning/levels/:id       — partial update
// PUT   /admin/learning/levels/:id       — full update
// DELETE /admin/learning/levels/:id      — delete
router.get('/levels', listAllLevels);
router.post(
  '/levels',
  auditAction({ action: 'LEVEL_CREATED', module: 'LEARNING', entity: 'Level' }),
  createLevelFlat,
);
router.patch(
  '/levels/reorder',
  validate(reorderLevelsSchema),
  auditAction({ action: 'LEVEL_REORDERED', module: 'LEARNING', entity: 'Level' }),
  reorderLevels,
);
router.patch(
  '/levels/:id',
  auditAction({ action: 'LEVEL_UPDATED', module: 'LEARNING', entity: 'Level' }),
  patchLevel,
);
router.put(
  '/levels/:id',
  validate(updateLevelSchema),
  auditAction({ action: 'LEVEL_UPDATED', module: 'LEARNING', entity: 'Level' }),
  updateLevel,
);
router.delete(
  '/levels/:id',
  auditAction({ action: 'LEVEL_DELETED', module: 'LEARNING', entity: 'Level' }),
  deleteLevel,
);

router.get(
  '/content',
  validate(listContentSchema),
  listContent,
);
router.post(
  '/content',
  validate(createContentSchema),
  auditAction({ action: 'CONTENT_CREATED', module: 'LEARNING', entity: 'LearningContent' }),
  createContent,
);
router.patch(
  '/content/reorder',
  validate(reorderContentSchema),
  auditAction({ action: 'CONTENT_REORDERED', module: 'LEARNING', entity: 'LearningContent' }),
  reorderContent,
);

// ── Bulk operations (must be before /content/:id) ─────────────────────────
router.post(
  '/content/bulk-status',
  validate(bulkStatusSchema),
  auditAction({ action: 'CONTENT_BULK_STATUS_UPDATED', module: 'LEARNING', entity: 'LearningContent' }),
  bulkUpdateContentStatus,
);
router.post(
  '/content/bulk-delete',
  validate(bulkDeleteSchema),
  auditAction({ action: 'CONTENT_BULK_DELETED', module: 'LEARNING', entity: 'LearningContent' }),
  bulkDeleteContent,
);

router.get(
  '/content/:id',
  validate(getContentByIdSchema),
  getContent,
);
router.put(
  '/content/:id',
  validate(updateContentSchema),
  auditAction({ action: 'CONTENT_UPDATED', module: 'LEARNING', entity: 'LearningContent' }),
  updateContent,
);
router.patch(
  '/content/:id',
  auditAction({ action: 'CONTENT_UPDATED', module: 'LEARNING', entity: 'LearningContent' }),
  updateContent,
);
router.delete(
  '/content/:id',
  validate(getContentByIdSchema),
  auditAction({ action: 'CONTENT_DELETED', module: 'LEARNING', entity: 'LearningContent' }),
  deleteContent,
);
router.post(
  '/content/:id/publish',
  validate(publishContentSchema),
  auditAction({ action: 'CONTENT_PUBLISHED', module: 'LEARNING', entity: 'LearningContent' }),
  publishContent,
);
router.post(
  '/content/:id/unpublish',
  validate(publishContentSchema),
  auditAction({ action: 'CONTENT_UNPUBLISHED', module: 'LEARNING', entity: 'LearningContent' }),
  unpublishContent,
);
router.post(
  '/content/:id/archive',
  validate(publishContentSchema),
  auditAction({ action: 'CONTENT_ARCHIVED', module: 'LEARNING', entity: 'LearningContent' }),
  archiveContent,
);

router.post(
  '/content/:id/notes',
  uploadLearningNoteImage,   // multer must parse multipart body BEFORE validation
  validate(uploadNoteSchema),
  auditAction({ action: 'NOTE_IMAGE_UPLOADED', module: 'LEARNING', entity: 'LearningNoteImage' }),
  uploadNote,
);
router.delete(
  '/notes/:noteId',
  validate(deleteNoteSchema),
  auditAction({ action: 'NOTE_IMAGE_DELETED', module: 'LEARNING', entity: 'LearningNoteImage' }),
  deleteNote,
);
router.delete(
  '/content/:contentId/notes/:noteId',
  auditAction({ action: 'NOTE_IMAGE_DELETED', module: 'LEARNING', entity: 'LearningNoteImage' }),
  deleteNote,
);
router.get(
  '/content/:id/notes',
  validate(getNotesSchema),
  getNotes,
);

export default router;
