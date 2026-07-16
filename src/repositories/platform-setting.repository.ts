import { PlatformSetting, Prisma as _Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class PlatformSettingRepository {
  async findAll(): Promise<PlatformSetting[]> {
    return prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async findByKey(key: string): Promise<PlatformSetting | null> {
    return prisma.platformSetting.findUnique({ where: { key } });
  }

  async upsert(key: string, value: string, description?: string): Promise<PlatformSetting> {
    return prisma.platformSetting.upsert({
      where: { key },
      update: { value, ...(description !== undefined ? { description } : {}) },
      create: { key, value, description: description ?? null },
    });
  }

  async updateMany(settings: { key: string; value: string; description?: string }[]): Promise<PlatformSetting[]> {
    return prisma.$transaction(
      settings.map((s) =>
        prisma.platformSetting.upsert({
          where: { key: s.key },
          update: { value: s.value, ...(s.description !== undefined ? { description: s.description } : {}) },
          create: { key: s.key, value: s.value, description: s.description ?? null },
        }),
      ),
    );
  }
}

export const platformSettingRepository = new PlatformSettingRepository();
