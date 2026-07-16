import { Project, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface ProjectFilters {
  categoryId?: string;
  difficulty?: string;
  technologyId?: string;
  search?: string;
  isPublished?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class ProjectRepository {
  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return prisma.project.create({
      data,
      include: { category: true, technologies: { include: { technology: true } } },
    });
  }

  async findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        category: true,
        technologies: { include: { technology: true } },
        _count: { select: { teams: true, milestones: true, files: true } },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.project.findUnique({
      where: { slug },
      include: {
        category: true,
        technologies: { include: { technology: true } },
        _count: { select: { teams: true } },
      },
    });
  }

  async findAll(
    filters: ProjectFilters,
    pagination: PaginationOptions,
  ): Promise<{ data: Project[]; total: number }> {
    const where: Prisma.ProjectWhereInput = {};

    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty as Prisma.EnumProjectDifficultyFilter;
    }

    if (filters.technologyId) {
      where.technologies = {
        some: { technologyId: filters.technologyId },
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { overview: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          category: true,
          technologies: { include: { technology: true } },
          _count: { select: { teams: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      prisma.project.count({ where }),
    ]);

    return { data: data as unknown as Project[], total };
  }

  async update(id: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({
      where: { id },
      data,
      include: { category: true, technologies: { include: { technology: true } } },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.project.delete({ where: { id } });
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.ProjectWhereInput = { slug };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await prisma.project.count({ where });
    return count > 0;
  }

  async addTechnology(projectId: string, technologyId: string): Promise<void> {
    await prisma.projectTechnologyRelation.create({
      data: { projectId, technologyId },
    });
  }

  async removeTechnology(projectId: string, technologyId: string): Promise<void> {
    await prisma.projectTechnologyRelation.deleteMany({
      where: { projectId, technologyId },
    });
  }

  async hasTechnology(projectId: string, technologyId: string): Promise<boolean> {
    const count = await prisma.projectTechnologyRelation.count({
      where: { projectId, technologyId },
    });
    return count > 0;
  }
}

export const projectRepository = new ProjectRepository();
