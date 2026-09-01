import { Category, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface CategoryFilters {
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class CategoryRepository {
  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return prisma.category.create({ data });
  }

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { slug } });
  }

  async findAll(
    filters: CategoryFilters,
    pagination: PaginationOptions,
  ): Promise<{ data: Category[]; total: number }> {
    const where: Prisma.CategoryWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: pagination.limit,
      }),
      prisma.category.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.category.delete({ where: { id } });
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.CategoryWhereInput = { slug };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await prisma.category.count({ where });
    return count > 0;
  }

  async searchByTitle(query: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: {
        isActive: true,
        title: { contains: query, mode: 'insensitive' },
      },
      orderBy: { displayOrder: 'asc' },
      take: 10,
    });
  }
}

export const categoryRepository = new CategoryRepository();
