/**
 * CoursePdf Service
 * Admin uploads PDFs → stored in Supabase 'course-pdfs' bucket.
 * Students can list published PDFs and get their public URLs.
 */
import { prisma } from '../config/database';
import { supabase, COURSE_PDFS_BUCKET } from '../config/supabase';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../constants';
import { logger } from '../utils/logger';

export interface CoursePdfRecord {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  isPublished: boolean;
  displayOrder: number;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

class CoursePdfService {
  // ── Admin: upload PDF ────────────────────────────────────────────────────────

  async upload(
    adminId: string,
    file: Express.Multer.File,
    title: string,
    description?: string,
  ): Promise<CoursePdfRecord> {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `pdfs/${timestamp}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(COURSE_PDFS_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      logger.error('[CoursePdf] Upload failed', { error: uploadError.message });
      throw new AppError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        `PDF upload failed: ${uploadError.message}`,
      );
    }

    const { data: urlData } = supabase.storage
      .from(COURSE_PDFS_BUCKET)
      .getPublicUrl(storagePath);

    const record = await prisma.coursePdf.create({
      data: {
        title,
        description: description ?? null,
        fileUrl: urlData.publicUrl,
        fileName: file.originalname,
        fileSize: file.size,
        isPublished: false,
        displayOrder: 0,
        uploadedBy: adminId,
      },
    });

    return record as CoursePdfRecord;
  }

  // ── Admin: list all PDFs (including unpublished) ─────────────────────────────

  async listAll(): Promise<CoursePdfRecord[]> {
    const rows = await prisma.coursePdf.findMany({
      where: { deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return rows as CoursePdfRecord[];
  }

  // ── Admin: update metadata ───────────────────────────────────────────────────

  async update(
    id: string,
    data: Partial<{ title: string; description: string; isPublished: boolean; displayOrder: number }>,
  ): Promise<CoursePdfRecord> {
    const existing = await prisma.coursePdf.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, 'PDF not found');

    const updated = await prisma.coursePdf.update({ where: { id }, data });
    return updated as CoursePdfRecord;
  }

  // ── Admin: delete PDF ────────────────────────────────────────────────────────

  async delete(id: string): Promise<void> {
    const existing = await prisma.coursePdf.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, 'PDF not found');

    // Remove from Supabase storage
    try {
      const urlObj = new URL(existing.fileUrl);
      const marker = `/object/public/${COURSE_PDFS_BUCKET}/`;
      const markerIdx = urlObj.pathname.indexOf(marker);
      if (markerIdx !== -1) {
        const storagePath = urlObj.pathname.slice(markerIdx + marker.length);
        await supabase.storage.from(COURSE_PDFS_BUCKET).remove([storagePath]);
      }
    } catch (e) {
      logger.warn('[CoursePdf] Could not delete from storage', { id, error: (e as Error).message });
    }

    // Soft-delete in DB
    await prisma.coursePdf.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Student: list published PDFs ─────────────────────────────────────────────

  async listPublished(): Promise<CoursePdfRecord[]> {
    const rows = await prisma.coursePdf.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return rows as CoursePdfRecord[];
  }
}

export const coursePdfService = new CoursePdfService();
