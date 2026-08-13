/**
 * CoursePdf Controller
 * Admin: upload, list, update, delete
 * Student: list published
 */
import { Response, NextFunction } from 'express';
import { coursePdfService } from '../services/course-pdf.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../constants';
import { AuthenticatedRequest } from '../types';

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminUploadPdf = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
    if (!req.file) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'No PDF file provided');

    const { title, description } = req.body as { title?: string; description?: string };
    if (!title?.trim()) throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Title is required');

    const record = await coursePdfService.upload(req.user.userId, req.file, title.trim(), description?.trim());
    sendCreated(res, 'PDF uploaded successfully', record);
  } catch (err) {
    next(err);
  }
};

export const adminListPdfs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const pdfs = await coursePdfService.listAll();
    sendSuccess(res, 'PDFs fetched', pdfs);
  } catch (err) {
    next(err);
  }
};

export const adminUpdatePdf = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, isPublished, displayOrder } = req.body as {
      title?: string;
      description?: string;
      isPublished?: boolean;
      displayOrder?: number;
    };

    const updated = await coursePdfService.update(id, {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(isPublished !== undefined && { isPublished }),
      ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
    });
    sendSuccess(res, 'PDF updated', updated);
  } catch (err) {
    next(err);
  }
};

export const adminDeletePdf = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await coursePdfService.delete(req.params.id);
    sendSuccess(res, 'PDF deleted', null);
  } catch (err) {
    next(err);
  }
};

// ── Student ───────────────────────────────────────────────────────────────────

export const studentListPublishedPdfs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const pdfs = await coursePdfService.listPublished();
    sendSuccess(res, 'PDFs fetched', pdfs);
  } catch (err) {
    next(err);
  }
};
