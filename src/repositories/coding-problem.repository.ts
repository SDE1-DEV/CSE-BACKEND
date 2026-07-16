import { CodingProblem, Prisma, ProblemDifficulty } from '@prisma/client';
import { prisma } from '../config/database';

export interface CodingProblemFilters {
  difficulty?: ProblemDifficulty;
  categoryId?: string;
  tagId?: string;
  companyId?: string;
  search?: string;
  isPublished?: boolean;
  solvedByUserId?: string;   // filter problems solved by this user
  unsolvedByUserId?: string; // filter problems NOT solved by this user
}

export interface CodingProblemSort {
  sortBy?: 'createdAt' | 'difficulty' | 'title' | 'acceptanceRate' | 'points';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

const PROBLEM_INCLUDE = {
  category: true,
  tags: { include: { tag: true } },
  companies: { include: { company: true } },
  _count: { select: { submissions: true, testCases: true } },
} as const;

export class CodingProblemRepository {
  async create(data: Prisma.CodingProblemCreateInput): Promise<CodingProblem> {
    return prisma.codingProblem.create({ data });
  }

  async findById(id: string, includeRelations = false): Promise<CodingProblem | null> {
    if (!includeRelations) {
      return prisma.codingProblem.findUnique({ where: { id } });
    }
    return prisma.codingProblem.findUnique({
      where: { id },
      include: PROBLEM_INCLUDE,
    }) as Promise<CodingProblem | null>;
  }

  async findBySlug(slug: string): Promise<CodingProblem | null> {
    return prisma.codingProblem.findUnique({ where: { slug } });
  }

  async findAll(
    filters: CodingProblemFilters,
    sort: CodingProblemSort,
    pagination: PaginationOptions,
  ): Promise<{ data: unknown[]; total: number }> {
    const where: Prisma.CodingProblemWhereInput = {};

    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.isPublished !== undefined) where.isPublished = filters.isPublished;

    if (filters.tagId) {
      where.tags = { some: { tagId: filters.tagId } };
    }

    if (filters.companyId) {
      where.companies = { some: { companyId: filters.companyId } };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { problemStatement: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.solvedByUserId) {
      where.submissions = {
        some: {
          userId: filters.solvedByUserId,
          status: 'ACCEPTED',
        },
      };
    }

    if (filters.unsolvedByUserId) {
      where.NOT = {
        submissions: {
          some: {
            userId: filters.unsolvedByUserId,
            status: 'ACCEPTED',
          },
        },
      };
    }

    // Build orderBy
    const difficultyOrder: Record<string, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };
    const sortField = sort.sortBy ?? 'createdAt';
    const sortDir = sort.sortOrder ?? 'desc';

    let orderBy: Prisma.CodingProblemOrderByWithRelationInput;
    if (sortField === 'difficulty') {
      // Prisma doesn't sort enums naturally by order, so we use raw; fallback to title
      orderBy = { difficulty: sortDir };
    } else {
      orderBy = { [sortField]: sortDir };
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const [data, total] = await Promise.all([
      prisma.codingProblem.findMany({
        where,
        include: PROBLEM_INCLUDE,
        orderBy,
        skip,
        take: pagination.limit,
      }),
      prisma.codingProblem.count({ where }),
    ]);

    // Post-sort for difficulty if needed
    let sorted = data;
    if (sortField === 'difficulty') {
      sorted = [...data].sort((a, b) => {
        const av = difficultyOrder[a.difficulty] ?? 0;
        const bv = difficultyOrder[b.difficulty] ?? 0;
        return sortDir === 'asc' ? av - bv : bv - av;
      });
    }

    return { data: sorted, total };
  }

  async update(id: string, data: Prisma.CodingProblemUpdateInput): Promise<CodingProblem> {
    return prisma.codingProblem.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.codingProblem.delete({ where: { id } });
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.CodingProblemWhereInput = { slug };
    if (excludeId) where.id = { not: excludeId };
    return (await prisma.codingProblem.count({ where })) > 0;
  }

  async updateAcceptanceRate(id: string): Promise<void> {
    const [total, accepted] = await Promise.all([
      prisma.submission.count({ where: { problemId: id } }),
      prisma.submission.count({ where: { problemId: id, status: 'ACCEPTED' } }),
    ]);
    const rate = total > 0 ? (accepted / total) * 100 : 0;
    await prisma.codingProblem.update({
      where: { id },
      data: { acceptanceRate: parseFloat(rate.toFixed(2)) },
    });
  }

  // Tags & Companies M2M helpers
  async addTag(problemId: string, tagId: string): Promise<void> {
    await prisma.problemTagRelation.upsert({
      where: { problemId_tagId: { problemId, tagId } },
      create: { problemId, tagId },
      update: {},
    });
  }

  async removeTag(problemId: string, tagId: string): Promise<void> {
    await prisma.problemTagRelation.deleteMany({ where: { problemId, tagId } });
  }

  async addCompany(problemId: string, companyId: string): Promise<void> {
    await prisma.problemCompany.upsert({
      where: { problemId_companyId: { problemId, companyId } },
      create: { problemId, companyId },
      update: {},
    });
  }

  async removeCompany(problemId: string, companyId: string): Promise<void> {
    await prisma.problemCompany.deleteMany({ where: { problemId, companyId } });
  }
}

export const codingProblemRepository = new CodingProblemRepository();
