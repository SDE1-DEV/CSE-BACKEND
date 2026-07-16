import { FavoriteProblem, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class FavoriteRepository {
  async create(userId: string, problemId: string): Promise<FavoriteProblem> {
    return prisma.favoriteProblem.create({
      data: { userId, problemId },
    });
  }

  async findByUserAndProblem(userId: string, problemId: string): Promise<FavoriteProblem | null> {
    return prisma.favoriteProblem.findUnique({
      where: { userId_problemId: { userId, problemId } },
    });
  }

  async deleteByUserAndProblem(userId: string, problemId: string): Promise<void> {
    await prisma.favoriteProblem.deleteMany({ where: { userId, problemId } });
  }

  async findAllByUser(
    userId: string,
    pagination: PaginationOptions,
  ): Promise<{ data: FavoriteProblem[]; total: number }> {
    const where: Prisma.FavoriteProblemWhereInput = { userId };
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.favoriteProblem.findMany({
        where,
        include: {
          problem: {
            include: {
              category: true,
              tags: { include: { tag: true } },
              companies: { include: { company: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      prisma.favoriteProblem.count({ where }),
    ]);

    return { data: data as FavoriteProblem[], total };
  }
}

export const favoriteRepository = new FavoriteRepository();
