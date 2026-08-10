import { LearningContent, LearningNoteImage, Role, CourseStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { HTTP_STATUS } from '../../constants';
import { buildPaginated } from '../../utils/response';
import { auditLogRepository } from '../../repositories/admin/audit-log.repository';
import { storageService } from './storage.service';

export interface GetContentListQuery {
  courseId?: string;
  levelId?: string;
  published?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateContentInput {
  courseId: string;
  levelId: string;
  dayNumber: number;
  topicName: string;
  slug?: string;
  description?: string;
  reelUrl?: string;
  youtubeUrl?: string;
  published?: boolean;
  order?: number;
}

export interface UpdateContentInput {
  levelId?: string;
  dayNumber?: number;
  topicName?: string;
  slug?: string;
  description?: string;
  reelUrl?: string;
  youtubeUrl?: string;
  published?: boolean;
  order?: number;
}

export interface ContentOrder {
  id: string;
  order: number;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueContentSlug(title: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.learningContent.findFirst({
      where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) break;
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
}

export class ContentService {
  async getContentList(
    query: GetContentListQuery,
    includeDrafts = false,
  ): Promise<{
    data: LearningContent[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const where: Record<string, unknown> = {};

    if (query.courseId) where['courseId'] = query.courseId;
    if (query.levelId) where['levelId'] = query.levelId;

    if (query.search) {
      where['OR'] = [
        { topicName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (includeDrafts) {
      if (query.published !== undefined) where['published'] = query.published;
    } else {
      where['published'] = true;
    }

    const [data, total] = await Promise.all([
      prisma.learningContent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { noteImages: true },
        orderBy: [
          { order: 'asc' },
          { dayNumber: 'asc' },
        ],
      }),
      prisma.learningContent.count({ where }),
    ]);

    return buildPaginated(data, total, page, limit);
  }

  async getContentById(
    id: string,
    includeDrafts = false,
  ): Promise<LearningContent & { noteImages: LearningNoteImage[] }> {
    const content = await prisma.learningContent.findUnique({
      where: { id },
      include: { noteImages: { orderBy: { imageOrder: 'asc' } } },
    });

    if (!content) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Learning content not found');
    }

    if (!includeDrafts && !content.published) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Learning content not found');
    }

    return content;
  }

  async createContent(
    data: CreateContentInput,
    actorId: string,
  ): Promise<LearningContent> {
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      select: { id: true },
    });
    if (!course) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Course not found');
    }

    const level = await prisma.level.findUnique({
      where: { id: data.levelId },
      select: { id: true, courseId: true },
    });
    if (!level) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Level not found');
    }
    if (level.courseId !== data.courseId) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Level does not belong to the specified course');
    }

    const existingDay = await prisma.learningContent.findFirst({
      where: { courseId: data.courseId, dayNumber: data.dayNumber },
      select: { id: true },
    });
    if (existingDay) {
      throw new AppError(
        HTTP_STATUS.CONFLICT,
        `Day number ${data.dayNumber} already exists for this course`,
      );
    }

    const slug = data.slug && data.slug.trim().length > 0
      ? await generateUniqueContentSlug(data.slug)
      : await generateUniqueContentSlug(`day-${data.dayNumber}-${data.topicName}`);

    return prisma.$transaction(async (tx) => {
      const content = await tx.learningContent.create({
        data: {
          courseId: data.courseId,
          levelId: data.levelId,
          dayNumber: data.dayNumber,
          topicName: data.topicName,
          slug,
          description: data.description ?? null,
          reelUrl: data.reelUrl ?? null,
          youtubeUrl: data.youtubeUrl ?? null,
          published: data.published ?? false,
          publishedAt: data.published ? new Date() : null,
          order: data.order ?? 0,
          createdBy: actorId,
        },
      });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'CONTENT_CREATED',
        module: 'LEARNING',
        entity: 'LearningContent',
        entityId: content.id,
        newValue: content as unknown as object,
      });

      return content;
    });
  }

  async updateContent(
    id: string,
    data: UpdateContentInput,
    actorId: string,
  ): Promise<LearningContent> {
    const existing = await prisma.learningContent.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Learning content not found');
    }

    if (data.levelId && data.levelId !== existing.levelId) {
      const level = await prisma.level.findUnique({
        where: { id: data.levelId },
        select: { id: true, courseId: true },
      });
      if (!level) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, 'Level not found');
      }
      if (level.courseId !== existing.courseId) {
        throw new AppError(
          HTTP_STATUS.BAD_REQUEST,
          'Level does not belong to the same course',
        );
      }
    }

    if (data.dayNumber && data.dayNumber !== existing.dayNumber) {
      const conflict = await prisma.learningContent.findFirst({
        where: {
          courseId: existing.courseId,
          dayNumber: data.dayNumber,
          NOT: { id },
        },
        select: { id: true },
      });
      if (conflict) {
        throw new AppError(
          HTTP_STATUS.CONFLICT,
          `Day number ${data.dayNumber} already exists for this course`,
        );
      }
    }

    let slug = existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      slug = await generateUniqueContentSlug(data.slug, id);
    } else if (data.topicName && data.topicName !== existing.topicName && !data.slug) {
      slug = await generateUniqueContentSlug(
        `day-${data.dayNumber ?? existing.dayNumber}-${data.topicName}`,
        id,
      );
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.learningContent.update({
        where: { id },
        data: {
          levelId: data.levelId,
          dayNumber: data.dayNumber,
          topicName: data.topicName,
          slug,
          description: data.description,
          reelUrl: data.reelUrl,
          youtubeUrl: data.youtubeUrl,
          published: data.published,
          publishedAt:
            data.published && !existing.published
              ? new Date()
              : existing.publishedAt,
          order: data.order,
        },
      });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'CONTENT_UPDATED',
        module: 'LEARNING',
        entity: 'LearningContent',
        entityId: id,
        oldValue: existing as unknown as object,
        newValue: updated as unknown as object,
      });

      return updated;
    });
  }

  async deleteContent(id: string, actorId: string): Promise<void> {
    const existing = await prisma.learningContent.findUnique({
      where: { id },
      include: { noteImages: true },
    });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Learning content not found');
    }

    await prisma.$transaction(async (tx) => {
      for (const note of existing.noteImages) {
        await storageService.deleteNoteImage(note.storagePath);
      }

      await tx.learningContent.delete({ where: { id } });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'CONTENT_DELETED',
        module: 'LEARNING',
        entity: 'LearningContent',
        entityId: id,
        oldValue: existing as unknown as object,
      });
    });
  }

  async publishContent(id: string, actorId: string): Promise<LearningContent> {
    const existing = await prisma.learningContent.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Learning content not found');
    }
    if (existing.published) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Content is already published');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.learningContent.update({
        where: { id },
        data: {
          published: true,
          publishedAt: new Date(),
        },
      });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'CONTENT_PUBLISHED',
        module: 'LEARNING',
        entity: 'LearningContent',
        entityId: id,
        newValue: { published: true, publishedAt: updated.publishedAt },
      });

      return updated;
    });
  }

  async unpublishContent(id: string, actorId: string): Promise<LearningContent> {
    const existing = await prisma.learningContent.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Learning content not found');
    }
    if (!existing.published) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Content is already unpublished');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.learningContent.update({
        where: { id },
        data: {
          published: false,
        },
      });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'CONTENT_UNPUBLISHED',
        module: 'LEARNING',
        entity: 'LearningContent',
        entityId: id,
        newValue: { published: false },
      });

      return updated;
    });
  }

  async reorderContent(orders: ContentOrder[], actorId: string): Promise<void> {
    if (orders.length === 0) return;

    await prisma.$transaction([
      ...orders.map((item) =>
        prisma.learningContent.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    ]);

    for (const item of orders) {
      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'CONTENT_REORDERED',
        module: 'LEARNING',
        entity: 'LearningContent',
        entityId: item.id,
        newValue: { order: item.order },
      });
    }
  }

  async uploadNote(
    contentId: string,
    file: { buffer: Buffer; originalName: string; mimetype: string },
    noteOrder: number,
    actorId: string,
  ): Promise<LearningNoteImage> {
    const content = await prisma.learningContent.findUnique({
      where: { id: contentId },
      select: { id: true, courseId: true, levelId: true, dayNumber: true },
    });
    if (!content) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Learning content not found');
    }

    return prisma.$transaction(async (tx) => {
      await storageService.validateNoteImageCount(contentId, tx);

      const { imageUrl, storagePath } = await storageService.uploadNoteImage(
        file.buffer,
        file.originalName,
        file.mimetype,
        content.courseId,
        content.levelId,
        content.dayNumber,
      );

      const note = await tx.learningNoteImage.create({
        data: {
          learningContentId: contentId,
          imageUrl,
          storagePath,
          imageOrder: noteOrder,
        },
      });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'NOTE_IMAGE_UPLOADED',
        module: 'LEARNING',
        entity: 'LearningNoteImage',
        entityId: note.id,
        newValue: { learningContentId: contentId, imageOrder: noteOrder },
      });

      return note;
    });
  }

  async deleteNote(noteId: string, actorId: string): Promise<void> {
    const note = await prisma.learningNoteImage.findUnique({
      where: { id: noteId },
      select: { id: true, storagePath: true, learningContentId: true },
    });
    if (!note) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Note image not found');
    }

    await prisma.$transaction(async (tx) => {
      await storageService.deleteNoteImage(note.storagePath);

      await tx.learningNoteImage.delete({ where: { id: noteId } });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'NOTE_IMAGE_DELETED',
        module: 'LEARNING',
        entity: 'LearningNoteImage',
        entityId: noteId,
        oldValue: { learningContentId: note.learningContentId, storagePath: note.storagePath },
      });
    });
  }

  async getNotes(contentId: string): Promise<LearningNoteImage[]> {
    const content = await prisma.learningContent.findUnique({
      where: { id: contentId },
      select: { id: true },
    });
    if (!content) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Learning content not found');
    }

    return prisma.learningNoteImage.findMany({
      where: { learningContentId: contentId },
      orderBy: { imageOrder: 'asc' },
    });
  }
}

export const contentService = new ContentService();
