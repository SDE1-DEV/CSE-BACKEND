import { codingProblemRepository, CodingProblemFilters, CodingProblemSort } from '../repositories/coding-problem.repository';
import { problemCategoryRepository } from '../repositories/problem-category.repository';
import { tagRepository } from '../repositories/tag.repository';
import { companyRepository } from '../repositories/company.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, CODING_MESSAGES } from '../constants';
import {
  CreateCodingProblemInput,
  UpdateCodingProblemInput,
  GetProblemsQuery,
} from '../validators/coding-problem.validator';

import { buildPaginated } from '../utils/response';

export class CodingProblemService {
  async create(data: CreateCodingProblemInput): Promise<unknown> {
    // Verify category exists
    const category = await problemCategoryRepository.findById(data.categoryId);
    if (!category) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_CATEGORY_NOT_FOUND);
    }

    const slugExists = await codingProblemRepository.existsBySlug(data.slug);
    if (slugExists) {
      throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.PROBLEM_SLUG_EXISTS);
    }

    return codingProblemRepository.create({
      category: { connect: { id: data.categoryId } },
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      problemStatement: data.problemStatement,
      inputFormat: data.inputFormat ?? null,
      outputFormat: data.outputFormat ?? null,
      constraints: data.constraints ?? null,
      sampleInput: data.sampleInput ?? null,
      sampleOutput: data.sampleOutput ?? null,
      explanation: data.explanation ?? null,
      difficulty: data.difficulty,
      timeLimit: data.timeLimit,
      memoryLimit: data.memoryLimit,
      points: data.points,
      isPublished: data.isPublished,
    });
  }

  async getById(id: string): Promise<unknown> {
    const problem = await codingProblemRepository.findById(id, true);
    if (!problem) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    }
    return problem;
  }

  /**
   * Fetch by slug (frontend uses slug for problem detail pages).
   * Falls back to UUID lookup so the route handler can pass either.
   */
  async getBySlugOrId(slugOrId: string, userId?: string): Promise<unknown> {
    // UUID regex
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);

    let problem: any = null;
    if (isUuid) {
      problem = await codingProblemRepository.findById(slugOrId, true);
    }
    if (!problem) {
      // Try slug lookup
      const { prisma } = await import('../config/database');
      problem = await prisma.codingProblem.findUnique({
        where: { slug: slugOrId },
        include: {
          category: true,
          tags: { include: { tag: true } },
          companies: { include: { company: true } },
          _count: { select: { submissions: true, testCases: true, discussions: true } },
        },
      });
    }

    if (!problem) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    }

    // Normalise shape expected by the frontend Problem type
    const normalised = this.normaliseProblem(problem, userId);
    return normalised;
  }

  /** Normalise raw Prisma problem into frontend-compatible shape */
  normaliseProblem(raw: any, _userId?: string): unknown {
    const tags = (raw.tags ?? []).map((t: any) => ({
      id: t.tag?.id ?? t.id,
      name: t.tag?.name ?? t.name,
      slug: t.tag?.slug ?? t.slug,
    }));
    const companies = (raw.companies ?? []).map((c: any) => ({
      id: c.company?.id ?? c.id,
      name: c.company?.name ?? c.name,
      logo: c.company?.logo ?? c.logo ?? null,
    }));
    const category = raw.category
      ? { id: raw.category.id, name: raw.category.name, slug: raw.category.slug }
      : { id: '', name: 'Uncategorised', slug: 'uncategorised' };

    // Build examples from sampleInput / sampleOutput fields
    const examples = [];
    if (raw.sampleInput || raw.sampleOutput) {
      examples.push({
        id: `${raw.id}-ex1`,
        input: raw.sampleInput ?? '',
        output: raw.sampleOutput ?? '',
        explanation: raw.explanation ?? undefined,
      });
    }

    return {
      id: raw.id,
      slug: raw.slug,
      title: raw.title,
      description: raw.problemStatement ?? raw.description ?? '',
      constraints: raw.constraints ?? null,
      difficulty: (raw.difficulty ?? 'EASY').toLowerCase() as string,
      acceptanceRate: raw.acceptanceRate ?? 0,
      totalSubmissions: raw._count?.submissions ?? 0,
      tags,
      companies,
      category,
      examples,
      isSolved: false,   // enriched in controller if userId provided
      isFavorite: false, // enriched in controller if userId provided
      discussionCount: raw._count?.discussions ?? 0,
      createdAt: raw.createdAt?.toISOString?.() ?? '',
      updatedAt: raw.updatedAt?.toISOString?.() ?? '',
    };
  }

  async getAll(
    query: GetProblemsQuery,
    userId?: string,
  ): Promise<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const filters: CodingProblemFilters = {};
    if (query.difficulty) filters.difficulty = query.difficulty;
    if (query.categoryId) filters.categoryId = query.categoryId;
    if (query.tagId) filters.tagId = query.tagId;
    if (query.companyId) filters.companyId = query.companyId;
    if (query.search) filters.search = query.search;
    if (query.isPublished !== undefined) filters.isPublished = query.isPublished;

    // solved / unsolved filters require userId
    if (query.solved === true && userId) filters.solvedByUserId = userId;
    if (query.solved === false && userId) filters.unsolvedByUserId = userId;

    const sort: CodingProblemSort = {
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    const { data, total } = await codingProblemRepository.findAll(filters, sort, { page, limit });
    return buildPaginated(data, total, page, limit);
  }

  async update(id: string, data: UpdateCodingProblemInput): Promise<unknown> {
    const problem = await codingProblemRepository.findById(id);
    if (!problem) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    }

    if (data.categoryId) {
      const category = await problemCategoryRepository.findById(data.categoryId);
      if (!category) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_CATEGORY_NOT_FOUND);
      }
    }

    if (data.slug && data.slug !== problem.slug) {
      const slugExists = await codingProblemRepository.existsBySlug(data.slug, id);
      if (slugExists) {
        throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.PROBLEM_SLUG_EXISTS);
      }
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.categoryId) {
      delete updateData.categoryId;
      updateData.category = { connect: { id: data.categoryId } };
    }

    return codingProblemRepository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    const problem = await codingProblemRepository.findById(id);
    if (!problem) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    }
    await codingProblemRepository.delete(id);
  }

  async addTag(problemId: string, tagId: string): Promise<void> {
    const [problem, tag] = await Promise.all([
      codingProblemRepository.findById(problemId),
      tagRepository.findById(tagId),
    ]);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    if (!tag) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.TAG_NOT_FOUND);
    await codingProblemRepository.addTag(problemId, tagId);
  }

  async removeTag(problemId: string, tagId: string): Promise<void> {
    const problem = await codingProblemRepository.findById(problemId);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    await codingProblemRepository.removeTag(problemId, tagId);
  }

  async addCompany(problemId: string, companyId: string): Promise<void> {
    const [problem, company] = await Promise.all([
      codingProblemRepository.findById(problemId),
      companyRepository.findById(companyId),
    ]);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    if (!company) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.COMPANY_NOT_FOUND);
    await codingProblemRepository.addCompany(problemId, companyId);
  }

  async removeCompany(problemId: string, companyId: string): Promise<void> {
    const problem = await codingProblemRepository.findById(problemId);
    if (!problem) throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_NOT_FOUND);
    await codingProblemRepository.removeCompany(problemId, companyId);
  }
}

export const codingProblemService = new CodingProblemService();
