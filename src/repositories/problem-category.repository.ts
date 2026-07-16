import { ProblemCategory, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface ProblemCategoryFilters {
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class ProblemCategoryRepository {
  async create(data: Prisma.ProblemCategoryCreateInput): Promise<ProblemCategory> {
    return prisma.problemCategory.create({ data });
  }

  async findById(id: string): Promise<ProblemCategory | null> {
    return prisma.problemCategory.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<ProblemCategory | null> {
    return prisma.problemCategory.findUnique({ where: { slug } });
  }

  async findAll(
    filters: ProblemCategoryFilters,
    pagination: PaginationOptions,
  ): Promise<{ data: ProblemCategory[]; total: number }> {
    const where: Prisma.ProblemCategoryWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const [data, total] = await Promise.all([
      prisma.problemCategory.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: pagination.limit,
      }),
      prisma.problemCategory.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, data: Prisma.ProblemCategoryUpdateInput): Promise<ProblemCategory> {
    return prisma.problemCategory.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.problemCategory.delete({ where: { id } });
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ProblemCategoryWhereInput = { slug };
    if (excludeId) where.id = { not: excludeId };
    const count = await prisma.problemCategory.count({ where });
    return count > 0;
  }
}

export const problemCategoryRepository = new ProblemCategoryRepository();
