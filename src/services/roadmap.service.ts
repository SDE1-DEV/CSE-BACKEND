import { Roadmap } from '@prisma/client';
import {
  roadmapRepository,
  RoadmapFilters,
  RoadmapSort,
  PaginationOptions,
} from '../repositories/roadmap.repository';
import { categoryRepository } from '../repositories/category.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';
import {
  CreateRoadmapInput,
  UpdateRoadmapInput,
  GetRoadmapsQuery,
} from '../validators/roadmap.validator';
import { cacheService, CacheKeys } from './cache.service';
import { env } from '../config/env';

export class RoadmapService {
  async createRoadmap(data: CreateRoadmapInput) {
    // Validate category exists
    const category = await categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.CATEGORY_NOT_FOUND);
    }

    const slugExists = await roadmapRepository.existsBySlug(data.slug);
    if (slugExists) {
      throw new AppError(HTTP_STATUS.CONFLICT, LEARNING_MESSAGES.ROADMAP_SLUG_EXISTS);
    }

    const roadmap = await roadmapRepository.create({
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      thumbnail: data.thumbnail ?? null,
      difficulty: data.difficulty,
      estimatedHours: data.estimatedHours ?? null,
      prerequisites: data.prerequisites ?? null,
      displayOrder: data.displayOrder ?? 0,
      isPublished: data.isPublished ?? false,
      category: { connect: { id: data.categoryId } },
    });

    // Invalidate roadmap list cache
    await cacheService.delPattern(`roadmaps:*`);
    return roadmap;
  }

  async getRoadmapById(id: string, isAdmin = false) {
    return cacheService.wrap(
      CacheKeys.ROADMAP(id),
      async () => {
        const roadmap = await roadmapRepository.findById(id, true);
        if (!roadmap) {
          throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
        }
        if (!isAdmin && !roadmap.isPublished) {
          throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
        }
        return roadmap;
      },
      env.CACHE_TTL_MEDIUM,
    );
  }

  async getRoadmaps(
    query: GetRoadmapsQuery,
    isAdmin = false,
  ): Promise<{ data: Roadmap[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);

    const filters: RoadmapFilters = {
      categoryId: query.categoryId,
      difficulty: query.difficulty,
      search: query.search,
    };

    // Non-admins only see published roadmaps
    if (!isAdmin) {
      filters.isPublished = true;
    } else if (query.isPublished !== undefined) {
      filters.isPublished = query.isPublished;
    }

    const sort: RoadmapSort = {
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    const pagination: PaginationOptions = { page, limit };
    const { data, total } = await roadmapRepository.findAll(filters, pagination, sort);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateRoadmap(id: string, data: UpdateRoadmapInput, isAdmin = false) {
    const roadmap = await roadmapRepository.findById(id);
    if (!roadmap) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
    }

    if (!isAdmin && !roadmap.isPublished) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
    }

    if (data.categoryId) {
      const category = await categoryRepository.findById(data.categoryId);
      if (!category) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.CATEGORY_NOT_FOUND);
      }
    }

    if (data.slug && data.slug !== roadmap.slug) {
      const slugExists = await roadmapRepository.existsBySlug(data.slug, id);
      if (slugExists) {
        throw new AppError(HTTP_STATUS.CONFLICT, LEARNING_MESSAGES.ROADMAP_SLUG_EXISTS);
      }
    }

    const updateData: Parameters<typeof roadmapRepository.update>[1] = { ...data };
    if (data.categoryId) {
      delete (updateData as Record<string, unknown>).categoryId;
      (updateData as Record<string, unknown>).category = { connect: { id: data.categoryId } };
    }

    const updated = await roadmapRepository.update(id, updateData);

    // Invalidate caches
    await Promise.all([
      cacheService.del(CacheKeys.ROADMAP(id)),
      cacheService.del(CacheKeys.ROADMAP(roadmap.slug)),
      cacheService.delPattern('roadmaps:*'),
    ]);

    return updated;
  }

  async deleteRoadmap(id: string): Promise<void> {
    const roadmap = await roadmapRepository.findById(id);
    if (!roadmap) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
    }
    await roadmapRepository.delete(id);

    await Promise.all([
      cacheService.del(CacheKeys.ROADMAP(id)),
      cacheService.del(CacheKeys.ROADMAP(roadmap.slug)),
      cacheService.delPattern('roadmaps:*'),
    ]);
  }
}

export const roadmapService = new RoadmapService();
