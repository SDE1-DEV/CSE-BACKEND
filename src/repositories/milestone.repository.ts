import { Milestone, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface MilestoneFilters {
  projectId?: string;
  status?: string;
  teamId?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class MilestoneRepository {
  async create(data: Prisma.MilestoneCreateInput): Promise<Milestone> {
    return prisma.milestone.create({
      data,
      include: { project: { select: { id: true, title: true, slug: true } } },
    });
  }

  async findById(id: string) {
    return prisma.milestone.findUnique({
      where: { id },
      include: { project: { select: { id: true, title: true, slug: true } } },
    });
  }

  async findAll(
    filters: MilestoneFilters,
    pagination: PaginationOptions,
  ): Promise<{ data: Milestone[]; total: number }> {
    const where: Prisma.MilestoneWhereInput = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status as Prisma.EnumMilestoneStatusFilter;

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.milestone.findMany({
        where,
        include: { project: { select: { id: true, title: true, slug: true } } },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: pagination.limit,
      }),
      prisma.milestone.count({ where }),
    ]);

    return { data: data as unknown as Milestone[], total };
  }

  async update(id: string, data: Prisma.MilestoneUpdateInput) {
    return prisma.milestone.update({
      where: { id },
      data,
      include: { project: { select: { id: true, title: true, slug: true } } },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.milestone.delete({ where: { id } });
  }
}

export const milestoneRepository = new MilestoneRepository();
