import { ProblemCategory } from '@prisma/client';
import { problemCategoryRepository, ProblemCategoryFilters } from '../repositories/problem-category.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, CODING_MESSAGES } from '../constants';
import {
  CreateProblemCategoryInput,
  UpdateProblemCategoryInput,
  GetProblemCategoriesQuery,
} from '../validators/problem-category.validator';

export class ProblemCategoryService {
  async create(data: CreateProblemCategoryInput): Promise<ProblemCategory> {
    const slugExists = await problemCategoryRepository.existsBySlug(data.slug);
    if (slugExists) {
      throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.PROBLEM_CATEGORY_SLUG_EXISTS);
    }

    return problemCategoryRepository.create({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
    });
  }

  async getById(id: string): Promise<ProblemCategory> {
    const category = await problemCategoryRepository.findById(id);
    if (!category) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_CATEGORY_NOT_FOUND);
    }
    return category;
  }

  async getAll(
    query: GetProblemCategoriesQuery,
    isAdmin = false,
  ): Promise<{ data: ProblemCategory[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const filters: ProblemCategoryFilters = { search: query.search };
    if (!isAdmin) {
      filters.isActive = true;
    } else if (query.isActive !== undefined) {
      filters.isActive = query.isActive;
    }

    const { data, total } = await problemCategoryRepository.findAll(filters, { page, limit });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, data: UpdateProblemCategoryInput): Promise<ProblemCategory> {
    const category = await problemCategoryRepository.findById(id);
    if (!category) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_CATEGORY_NOT_FOUND);
    }

    if (data.slug && data.slug !== category.slug) {
      const slugExists = await problemCategoryRepository.existsBySlug(data.slug, id);
      if (slugExists) {
        throw new AppError(HTTP_STATUS.CONFLICT, CODING_MESSAGES.PROBLEM_CATEGORY_SLUG_EXISTS);
      }
    }

    return problemCategoryRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const category = await problemCategoryRepository.findById(id);
    if (!category) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, CODING_MESSAGES.PROBLEM_CATEGORY_NOT_FOUND);
    }
    await problemCategoryRepository.delete(id);
  }
}

export const problemCategoryService = new ProblemCategoryService();
