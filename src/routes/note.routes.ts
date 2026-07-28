import { Router } from 'express';
import {
  getNoteForLesson,
  createOrReplaceNote,
  updateNote,
  deleteNote,
} from '../controllers/note.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';

const router = Router();

// ── Notes per-lesson (mounted at root so /lesson/:id/notes resolves correctly) ──

router.get('/lesson/:id/notes', authenticate, requireStudent, getNoteForLesson);
router.post('/lesson/:id/notes', authenticate, requireStudent, createOrReplaceNote);
router.patch('/lesson/:id/notes', authenticate, requireStudent, updateNote);
router.delete('/lesson/:id/notes', authenticate, requireStudent, deleteNote);

export default router;
