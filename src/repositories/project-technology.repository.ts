import { ProjectTechnology, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface TechnologyFilters {
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class ProjectTechnologyRepository {
  async create(data: Prisma.ProjectTechnologyCreateInput): Promise<ProjectTechnology> {
    return prisma.projectTechnology.create({ data });
  }

  async findById(id: string): Promise<ProjectTechnology | null> {
    return prisma.projectTechnology.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<ProjectTechnology | null> {
    return prisma.projectTechnology.findUnique({ where: { slug } });
  }

  async findAll(
    filters: TechnologyFilters,
    pagination: PaginationOptions,
  ): Promise<{ data: ProjectTechnology[]; total: number }> {
    const where: Prisma.ProjectTechnologyWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.projectTechnology.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: pagination.limit,
      }),
      prisma.projectTechnology.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, data: Prisma.ProjectTechnologyUpdateInput): Promise<ProjectTechnology> {
    return prisma.projectTechnology.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.projectTechnology.delete({ where: { id } });
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ProjectTechnologyWhereInput = { slug };
    if (excludeId) where.id = { not: excludeId };
    const count = await prisma.projectTechnology.count({ where });
    return count > 0;
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ProjectTechnologyWhereInput = {
      name: { equals: name, mode: 'insensitive' },
    };
    if (excludeId) where.id = { not: excludeId };
    const count = await prisma.projectTechnology.count({ where });
    return count > 0;
  }
}

export const projectTechnologyRepository = new ProjectTechnologyRepository();
