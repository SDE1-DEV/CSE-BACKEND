import { Difficulty, Prisma, Roadmap } from '@prisma/client';
import { prisma } from '../config/database';

export interface RoadmapFilters {
  categoryId?: string;
  difficulty?: Difficulty;
  search?: string;
  isPublished?: boolean;
}

export interface RoadmapSort {
  sortBy?: 'displayOrder' | 'createdAt' | 'title' | 'estimatedHours';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class RoadmapRepository {
  async create(data: Prisma.RoadmapCreateInput): Promise<Roadmap> {
    return prisma.roadmap.create({ data });
  }

  async findById(id: string, includeCategory = false) {
    return prisma.roadmap.findUnique({
      where: { id },
      include: includeCategory ? { category: true } : undefined,
    });
  }

  async findBySlug(slug: string) {
    return prisma.roadmap.findUnique({
      where: { slug },
      include: { category: true },
    });
  }

  async findAll(
    filters: RoadmapFilters,
    pagination: PaginationOptions,
    sort: RoadmapSort = {},
  ): Promise<{ data: Roadmap[]; total: number }> {
    const where: Prisma.RoadmapWhereInput = {};

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const sortField = sort.sortBy ?? 'displayOrder';
    const sortDir = sort.sortOrder ?? 'asc';

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.roadmap.findMany({
        where,
        include: { category: true },
        orderBy: { [sortField]: sortDir },
        skip,
        take: pagination.limit,
      }),
      prisma.roadmap.count({ where }),
    ]);

    return { data, total };
  }

  async update(id: string, data: Prisma.RoadmapUpdateInput): Promise<Roadmap> {
    return prisma.roadmap.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.roadmap.delete({ where: { id } });
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.RoadmapWhereInput = { slug };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await prisma.roadmap.count({ where });
    return count > 0;
  }

  async searchByTitle(query: string, isAdmin = false): Promise<Roadmap[]> {
    return prisma.roadmap.findMany({
      where: {
        ...(isAdmin ? {} : { isPublished: true }),
        title: { contains: query, mode: 'insensitive' },
      },
      include: { category: true },
      take: 10,
    });
  }
}

export const roadmapRepository = new RoadmapRepository();
