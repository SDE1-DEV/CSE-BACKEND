import { Level, CourseStatus, Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { HTTP_STATUS } from '../../constants';
import { auditLogRepository } from '../../repositories/admin/audit-log.repository';

export interface CreateLevelInput {
  levelNumber: number;
  title: string;
  description?: string;
  order?: number;
  status?: CourseStatus;
  youtubeUrl?: string;
}

export interface UpdateLevelInput {
  levelNumber?: number;
  title?: string;
  description?: string;
  order?: number;
  status?: CourseStatus;
  youtubeUrl?: string;
}

export interface LevelOrder {
  id: string;
  order: number;
}

export class LevelService {
  async getLevelsByCourse(
    courseId: string,
    includeDrafts = false,
  ): Promise<Level[]> {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Course not found');
    }

    const where: Record<string, unknown> = { courseId };
    if (!includeDrafts) {
      where['status'] = CourseStatus.PUBLISHED;
    }

    return prisma.level.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { levelNumber: 'asc' },
      ],
    });
  }

  async getLevelById(id: string): Promise<Level> {
    const level = await prisma.level.findUnique({ where: { id } });
    if (!level) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Level not found');
    }
    return level;
  }

  async createLevel(
    courseId: string,
    data: CreateLevelInput,
    actorId: string,
  ): Promise<Level> {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Course not found');
    }

    const existingLevelNumber = await prisma.level.findFirst({
      where: { courseId, levelNumber: data.levelNumber },
      select: { id: true },
    });
    if (existingLevelNumber) {
      throw new AppError(
        HTTP_STATUS.CONFLICT,
        `Level number ${data.levelNumber} already exists for this course`,
      );
    }

    return prisma.$transaction(async (tx) => {
      const level = await tx.level.create({
        data: {
          courseId,
          levelNumber: data.levelNumber,
          title: data.title,
          description: data.description ?? null,
          order: data.order ?? 0,
          status: data.status ?? CourseStatus.DRAFT,
          youtubeUrl: data.youtubeUrl ?? null,
          createdBy: actorId,
        },
      });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'LEVEL_CREATED',
        module: 'LEARNING',
        entity: 'Level',
        entityId: level.id,
        newValue: level as unknown as object,
      });

      return level;
    });
  }

  async updateLevel(
    id: string,
    data: UpdateLevelInput,
    actorId: string,
  ): Promise<Level> {
    const existing = await prisma.level.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Level not found');
    }

    if (data.levelNumber && data.levelNumber !== existing.levelNumber) {
      const conflict = await prisma.level.findFirst({
        where: {
          courseId: existing.courseId,
          levelNumber: data.levelNumber,
          NOT: { id },
        },
        select: { id: true },
      });
      if (conflict) {
        throw new AppError(
          HTTP_STATUS.CONFLICT,
          `Level number ${data.levelNumber} already exists for this course`,
        );
      }
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.level.update({
        where: { id },
        data: {
          levelNumber: data.levelNumber,
          title: data.title,
          description: data.description,
          order: data.order,
          status: data.status,
          youtubeUrl: data.youtubeUrl,
        },
      });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'LEVEL_UPDATED',
        module: 'LEARNING',
        entity: 'Level',
        entityId: id,
        oldValue: existing as unknown as object,
        newValue: updated as unknown as object,
      });

      return updated;
    });
  }

  async deleteLevel(id: string, actorId: string): Promise<void> {
    const existing = await prisma.level.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Level not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.level.delete({ where: { id } });

      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'LEVEL_DELETED',
        module: 'LEARNING',
        entity: 'Level',
        entityId: id,
        oldValue: existing as unknown as object,
      });
    });
  }

  async reorderLevels(
    orders: LevelOrder[],
    actorId: string,
  ): Promise<void> {
    if (orders.length === 0) return;

    await prisma.$transaction([
      ...orders.map((item) =>
        prisma.level.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    ]);

    for (const item of orders) {
      await auditLogRepository.create({
        performedBy: actorId,
        role: Role.MANAGER,
        action: 'LEVEL_REORDERED',
        module: 'LEARNING',
        entity: 'Level',
        entityId: item.id,
        newValue: { order: item.order },
      });
    }
  }
}

export const levelService = new LevelService();
