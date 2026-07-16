import { ProblemDiscussion, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class DiscussionRepository {
  async create(data: Prisma.ProblemDiscussionCreateInput): Promise<ProblemDiscussion> {
    return prisma.problemDiscussion.create({
      data,
      include: {
        user: { select: { id: true, fullName: true, profileImage: true } },
      },
    }) as Promise<ProblemDiscussion>;
  }

  async findById(id: string): Promise<ProblemDiscussion | null> {
    return prisma.problemDiscussion.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, profileImage: true } },
      },
    }) as Promise<ProblemDiscussion | null>;
  }

  async findByProblemId(
    problemId: string,
    pagination: PaginationOptions,
  ): Promise<{ data: ProblemDiscussion[]; total: number }> {
    const where: Prisma.ProblemDiscussionWhereInput = { problemId };
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.problemDiscussion.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, profileImage: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      prisma.problemDiscussion.count({ where }),
    ]);

    return { data: data as ProblemDiscussion[], total };
  }

  async update(id: string, content: string): Promise<ProblemDiscussion> {
    return prisma.problemDiscussion.update({
      where: { id },
      data: { content },
      include: {
        user: { select: { id: true, fullName: true, profileImage: true } },
      },
    }) as Promise<ProblemDiscussion>;
  }

  async delete(id: string): Promise<void> {
    await prisma.problemDiscussion.delete({ where: { id } });
  }
}

export const discussionRepository = new DiscussionRepository();
