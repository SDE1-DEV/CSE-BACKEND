import { ProjectCategory } from '@prisma/client';
import { projectCategoryRepository } from '../repositories/project-category.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PROJECT_MESSAGES } from '../constants';
import type { CreateProjectCategoryInput, UpdateProjectCategoryInput } from '../validators/project-category.validator';

export class ProjectCategoryService {
  async createCategory(data: CreateProjectCategoryInput): Promise<ProjectCategory> {
    const slugExists = await projectCategoryRepository.existsBySlug(data.slug);
    if (slugExists) {
      throw new AppError(HTTP_STATUS.CONFLICT, PROJECT_MESSAGES.PROJECT_CATEGORY_SLUG_EXISTS);
    }

    return projectCategoryRepository.create({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      icon: data.icon ?? null,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
    });
  }

  async getCategoryById(id: string): Promise<ProjectCategory> {
    const category = await projectCategoryRepository.findById(id);
    if (!category) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_CATEGORY_NOT_FOUND);
    }
    return category;
  }

  async getCategories(query: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }, isAdmin = false) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const filters: { isActive?: boolean; search?: string } = {
      search: query.search,
    };

    if (!isAdmin) {
      filters.isActive = true;
    } else if (query.isActive !== undefined) {
      filters.isActive = query.isActive;
    }

    const { data, total } = await projectCategoryRepository.findAll(filters, { page, limit });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateCategory(id: string, data: UpdateProjectCategoryInput): Promise<ProjectCategory> {
    const category = await projectCategoryRepository.findById(id);
    if (!category) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_CATEGORY_NOT_FOUND);
    }

    if (data.slug && data.slug !== category.slug) {
      const slugExists = await projectCategoryRepository.existsBySlug(data.slug, id);
      if (slugExists) {
        throw new AppError(HTTP_STATUS.CONFLICT, PROJECT_MESSAGES.PROJECT_CATEGORY_SLUG_EXISTS);
      }
    }

    return projectCategoryRepository.update(id, data);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await projectCategoryRepository.findById(id);
    if (!category) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_CATEGORY_NOT_FOUND);
    }
    await projectCategoryRepository.delete(id);
  }
}

export const projectCategoryService = new ProjectCategoryService();
