/**
 * Course PDF Routes
 *
 * Admin (SUPER_ADMIN only):
 *   POST   /admin/pdfs          — upload a PDF
 *   GET    /admin/pdfs          — list all PDFs
 *   PATCH  /admin/pdfs/:id      — update title / description / published / order
 *   DELETE /admin/pdfs/:id      — soft-delete PDF
 *
 * Student (any authenticated user):
 *   GET    /learning/pdfs       — list published PDFs
 */
import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireSuperAdmin, requireStudent } from '../middlewares/role.middleware';
import { uploadCoursePdf } from '../middlewares/pdf-upload.middleware';
import {
  adminUploadPdf,
  adminListPdfs,
  adminUpdatePdf,
  adminDeletePdf,
  studentListPublishedPdfs,
} from '../controllers/course-pdf.controller';

export const adminPdfRouter = Router();
adminPdfRouter.use(authenticate, requireSuperAdmin);
adminPdfRouter.post('/',      uploadCoursePdf, adminUploadPdf);
adminPdfRouter.get('/',       adminListPdfs);
adminPdfRouter.patch('/:id',  adminUpdatePdf);
adminPdfRouter.delete('/:id', adminDeletePdf);

export const studentPdfRouter = Router();
studentPdfRouter.get('/', authenticate, requireStudent, studentListPublishedPdfs);
