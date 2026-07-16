import { ProblemTag, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class TagRepository {
  async create(data: Prisma.ProblemTagCreateInput): Promise<ProblemTag> {
    return prisma.problemTag.create({ data });
  }

  async findById(id: string): Promise<ProblemTag | null> {
    return prisma.problemTag.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<ProblemTag | null> {
    return prisma.problemTag.findUnique({ where: { slug } });
  }

  async findAll(): Promise<ProblemTag[]> {
    return prisma.problemTag.findMany({ orderBy: { name: 'asc' } });
  }

  async update(id: string, data: Prisma.ProblemTagUpdateInput): Promise<ProblemTag> {
    return prisma.problemTag.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.problemTag.delete({ where: { id } });
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ProblemTagWhereInput = { slug };
    if (excludeId) where.id = { not: excludeId };
    return (await prisma.problemTag.count({ where })) > 0;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ProblemTagWhereInput = { name };
    if (excludeId) where.id = { not: excludeId };
    return (await prisma.problemTag.count({ where })) > 0;
  }
}

export const tagRepository = new TagRepository();
