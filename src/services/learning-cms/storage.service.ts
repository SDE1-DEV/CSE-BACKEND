import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { supabase, LEARNING_NOTES_BUCKET } from '../../config/supabase';
import { AppError } from '../../middlewares/error.middleware';
import { HTTP_STATUS, PROJECT_MESSAGES } from '../../constants';
import { logger } from '../../utils/logger';
import { randomUUID } from 'crypto';

type TransactionClient = Prisma.TransactionClient;

export const MAX_NOTES_IMAGES = 5;

export class StorageService {
  buildStoragePath(
    courseId: string,
    levelId: string,
    dayNumber: number,
    filename: string,
  ): string {
    const uuid = randomUUID();
    const cleanFilename = filename
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `learning-notes/${courseId}/${levelId}/day-${dayNumber}/${uuid}-${cleanFilename}`;
  }

  async uploadNoteImage(
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
    courseId: string,
    levelId: string,
    dayNumber: number,
  ): Promise<{ imageUrl: string; storagePath: string }> {
    const storagePath = this.buildStoragePath(courseId, levelId, dayNumber, originalName);

    const { error: uploadErr } = await supabase.storage
      .from(LEARNING_NOTES_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (uploadErr) {
      logger.error(`Note image upload failed: ${uploadErr.message}`, { storagePath });
      throw new AppError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        PROJECT_MESSAGES.FILE_UPLOAD_FAILED,
      );
    }

    const { data } = supabase.storage
      .from(LEARNING_NOTES_BUCKET)
      .getPublicUrl(storagePath);

    return {
      imageUrl: data.publicUrl,
      storagePath,
    };
  }

  async deleteNoteImage(storagePath: string): Promise<void> {
    if (!storagePath) return;

    const { error } = await supabase.storage
      .from(LEARNING_NOTES_BUCKET)
      .remove([storagePath]);

    if (error) {
      logger.warn(`Failed to delete note image from storage: ${error.message}`, {
        storagePath,
      });
    }
  }

  async validateNoteImageCount(
    learningContentId: string,
    prismaClient: TransactionClient | PrismaClient,
  ): Promise<void> {
    const count = await prismaClient.learningNoteImage.count({
      where: { learningContentId },
    });

    if (count >= MAX_NOTES_IMAGES) {
      throw new AppError(
        HTTP_STATUS.BAD_REQUEST,
        `Maximum ${MAX_NOTES_IMAGES} note images allowed per learning content`,
      );
    }
  }
}

export const storageService = new StorageService();
