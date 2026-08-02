/**
 * Category Service
 * PRD-06: Redis caching applied to frequently-accessed categories
 */

import { Category } from '@prisma/client';
import { categoryRepository, CategoryFilters, PaginationOptions } from '../repositories/category.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';
import { CreateCategoryInput, UpdateCategoryInput, GetCategoriesQuery } from '../validators/category.validator';
import { cacheService, CacheKeys } from './cache.service';
import { env } from '../config/env';

import { buildPaginated } from '../utils/response';

export class CategoryService {
  async createCategory(data: CreateCategoryInput): Promise<Category> {
    const slugExists = await categoryRepository.existsBySlug(data.slug);
    if (slugExists) {
      throw new AppError(HTTP_STATUS.CONFLICT, LEARNING_MESSAGES.CATEGORY_SLUG_EXISTS);
    }

    const category = await categoryRepository.create({
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      icon: data.icon ?? null,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
    });

    // Invalidate list cache on create
    await cacheService.delPattern('categories:*');
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.CATEGORY_NOT_FOUND);
    }
    return category;
  }

  async getCategoryById(id: string): Promise<Category> {
    return cacheService.wrap(
      CacheKeys.CATEGORY(id),
      async () => {
        const category = await categoryRepository.findById(id);
        if (!category) {
          throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.CATEGORY_NOT_FOUND);
        }
        return category;
      },
      env.CACHE_TTL_MEDIUM,
    );
  }

  async getCategories(
    query: GetCategoriesQuery,
    isAdmin = false,
  ): Promise<{ data: Category[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const filters: CategoryFilters = { search: query.search };

    if (!isAdmin) {
      filters.isActive = true;
    } else if (query.isActive !== undefined) {
      filters.isActive = query.isActive;
    }

    const pagination: PaginationOptions = { page, limit };

    // Cache public listing (non-admin, no search)
    if (!isAdmin && !query.search) {
      const cacheKey = `${CacheKeys.CATEGORIES_ALL}:p${page}:l${limit}`;
      return cacheService.wrap(
        cacheKey,
        async () => {
          const { data, total } = await categoryRepository.findAll(filters, pagination);
          return buildPaginated(data, total, page, limit);
        },
        env.CACHE_TTL_LONG,
      );
    }

    const { data, total } = await categoryRepository.findAll(filters, pagination);
    return buildPaginated(data, total, page, limit);
  }

  async updateCategory(id: string, data: UpdateCategoryInput): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.CATEGORY_NOT_FOUND);
    }

    if (data.slug && data.slug !== category.slug) {
      const slugExists = await categoryRepository.existsBySlug(data.slug, id);
      if (slugExists) {
        throw new AppError(HTTP_STATUS.CONFLICT, LEARNING_MESSAGES.CATEGORY_SLUG_EXISTS);
      }
    }

    const updated = await categoryRepository.update(id, data);

    // Invalidate caches
    await Promise.all([
      cacheService.del(CacheKeys.CATEGORY(id)),
      cacheService.delPattern('categories:*'),
    ]);

    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.CATEGORY_NOT_FOUND);
    }

    await categoryRepository.delete(id);

    // Invalidate caches
    await Promise.all([
      cacheService.del(CacheKeys.CATEGORY(id)),
      cacheService.delPattern('categories:*'),
    ]);
  }
}

export const categoryService = new CategoryService();
