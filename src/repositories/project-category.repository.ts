import { ProjectCategory, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface ProjectCategoryFilters {
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class ProjectCategoryRepository {
  async create(data: Prisma.ProjectCategoryCreateInput): Promise<ProjectCategory> {
    return prisma.projectCategory.create({ data });
  }

  async findById(id: string): Promise<ProjectCategory | null> {
    return prisma.projectCategory.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<ProjectCategory | null> {
    return prisma.projectCategory.findUnique({ where: { slug } });
  }

  async findAll(
    filters: ProjectCategoryFilters,
    pagination: PaginationOptions,
  ): Promise<{ data: ProjectCategory[]; total: number }> {
    const where: Prisma.ProjectCategoryWhereInput = {};

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
      prisma.projectCategory.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: pagination.limit,
      }),
      prisma.projectCategory.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, data: Prisma.ProjectCategoryUpdateInput): Promise<ProjectCategory> {
    return prisma.projectCategory.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.projectCategory.delete({ where: { id } });
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ProjectCategoryWhereInput = { slug };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await prisma.projectCategory.count({ where });
    return count > 0;
  }
}

export const projectCategoryRepository = new ProjectCategoryRepository();
