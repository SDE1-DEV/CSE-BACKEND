import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

/**
 * FPRD-11: Content Version Repository
 *
 * Central store for CMS version history. Every tracked content update records a
 * `ContentVersion` row (monotonic `version` per entity) capturing the before
 * (`oldValue`) and after (`newValue`) snapshots, so managers can review and
 * restore prior states without database access.
 */
export class ContentVersionRepository {
  /** Record a new version. `version` auto-increments per (entity, entityId). */
  async save(data: {
    entity: string;
    entityId: string;
    editedBy: string;
    oldValue?: object | null;
    newValue?: object | null;
    fieldName?: string | null;
    changeNote?: string | null;
  }) {
    const last = await prisma.contentVersion.findFirst({
      where: { entity: data.entity, entityId: data.entityId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    return prisma.contentVersion.create({
      data: {
        entity: data.entity,
        entityId: data.entityId,
        version: (last?.version ?? 0) + 1,
        editedBy: data.editedBy,
        fieldName: data.fieldName ?? null,
        oldValue: data.oldValue ? (data.oldValue as Prisma.InputJsonValue) : Prisma.JsonNull,
        newValue: data.newValue ? (data.newValue as Prisma.InputJsonValue) : Prisma.JsonNull,
        changeNote: data.changeNote ?? null,
      },
    });
  }

  /** List the most recent versions for an entity (newest first). */
  async list(entity: string, entityId: string, take = 50) {
    return prisma.contentVersion.findMany({
      where: { entity, entityId },
      include: { editor: { select: { id: true, fullName: true } } },
      orderBy: { version: 'desc' },
      take,
    });
  }

  async findById(id: string) {
    return prisma.contentVersion.findUnique({ where: { id } });
  }
}

export const contentVersionRepository = new ContentVersionRepository();
