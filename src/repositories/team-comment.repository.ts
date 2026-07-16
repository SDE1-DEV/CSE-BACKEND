import { TeamComment, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class TeamCommentRepository {
  async create(data: Prisma.TeamCommentCreateInput): Promise<TeamComment> {
    return prisma.teamComment.create({
      data,
      include: {
        user: { select: { id: true, fullName: true, email: true, profileImage: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.teamComment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, profileImage: true } },
      },
    });
  }

  async findByTaskId(
    taskId: string,
    pagination: PaginationOptions,
  ): Promise<{ data: TeamComment[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.teamComment.findMany({
        where: { taskId },
        include: {
          user: { select: { id: true, fullName: true, email: true, profileImage: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pagination.limit,
      }),
      prisma.teamComment.count({ where: { taskId } }),
    ]);

    return { data: data as unknown as TeamComment[], total };
  }

  async update(id: string, content: string): Promise<TeamComment> {
    return prisma.teamComment.update({
      where: { id },
      data: { content },
      include: {
        user: { select: { id: true, fullName: true, email: true, profileImage: true } },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.teamComment.delete({ where: { id } });
  }
}

export const teamCommentRepository = new TeamCommentRepository();
