import { Task, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface TaskFilters {
  teamId?: string;
  assignedTo?: string;
  status?: string;
  priority?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class TaskRepository {
  async create(data: Prisma.TaskCreateInput) {
    return prisma.task.create({
      data,
      include: {
        team: { select: { id: true, name: true } },
        assignee: { select: { id: true, fullName: true, email: true, profileImage: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true } },
        assignee: { select: { id: true, fullName: true, email: true, profileImage: true } },
        _count: { select: { comments: true } },
      },
    });
  }

  async findAll(
    filters: TaskFilters,
    pagination: PaginationOptions,
  ): Promise<{ data: Task[]; total: number }> {
    const where: Prisma.TaskWhereInput = {};

    if (filters.teamId) where.teamId = filters.teamId;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.status) where.status = filters.status as Prisma.EnumTaskStatusFilter;
    if (filters.priority) where.priority = filters.priority as Prisma.EnumTaskPriorityFilter;

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          team: { select: { id: true, name: true } },
          assignee: { select: { id: true, fullName: true, email: true, profileImage: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: pagination.limit,
      }),
      prisma.task.count({ where }),
    ]);

    return { data: data as unknown as Task[], total };
  }

  async update(id: string, data: Prisma.TaskUpdateInput) {
    return prisma.task.update({
      where: { id },
      data,
      include: {
        team: { select: { id: true, name: true } },
        assignee: { select: { id: true, fullName: true, email: true, profileImage: true } },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } });
  }
}

export const taskRepository = new TaskRepository();
