import { prisma } from '../config/database';
import { ProblemDifficulty } from '@prisma/client';

export interface CodingSearchResult {
  problems: unknown[];
  tags: unknown[];
  companies: unknown[];
  categories: unknown[];
  total: number;
}

export class CodingSearchService {
  async search(
    query: string,
    difficulty?: ProblemDifficulty,
    page = 1,
    limit = 20,
  ): Promise<{ data: CodingSearchResult; page: number; limit: number }> {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;

    const problemWhere = {
      isPublished: true,
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
        { tags: { some: { tag: { name: { contains: query, mode: 'insensitive' as const } } } } },
        { companies: { some: { company: { name: { contains: query, mode: 'insensitive' as const } } } } },
        { category: { name: { contains: query, mode: 'insensitive' as const } } },
      ],
      ...(difficulty ? { difficulty } : {}),
    };

    const [problems, problemTotal, tags, companies, categories] = await Promise.all([
      prisma.codingProblem.findMany({
        where: problemWhere,
        include: {
          category: true,
          tags: { include: { tag: true } },
          companies: { include: { company: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      prisma.codingProblem.count({ where: problemWhere }),
      prisma.problemTag.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: 10,
      }),
      prisma.company.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: 10,
      }),
      prisma.problemCategory.findMany({
        where: {
          isActive: true,
          name: { contains: query, mode: 'insensitive' },
        },
        take: 10,
      }),
    ]);

    return {
      data: { problems, tags, companies, categories, total: problemTotal },
      page,
      limit: safeLimit,
    };
  }
}

export const codingSearchService = new CodingSearchService();
