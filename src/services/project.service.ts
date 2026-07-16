import { projectRepository } from '../repositories/project.repository';
import { projectCategoryRepository } from '../repositories/project-category.repository';
import { projectTechnologyRepository } from '../repositories/project-technology.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PROJECT_MESSAGES } from '../constants';
import { projectEventEmitter } from '../events/project-events';
import type { CreateProjectInput, UpdateProjectInput } from '../validators/project.validator';

export class ProjectService {
  async createProject(data: CreateProjectInput) {
    const category = await projectCategoryRepository.findById(data.categoryId);
    if (!category) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_CATEGORY_NOT_FOUND);
    }

    const slugExists = await projectRepository.existsBySlug(data.slug);
    if (slugExists) {
      throw new AppError(HTTP_STATUS.CONFLICT, PROJECT_MESSAGES.PROJECT_SLUG_EXISTS);
    }

    const project = await projectRepository.create({
      category: { connect: { id: data.categoryId } },
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      overview: data.overview ?? null,
      difficulty: data.difficulty ?? 'BEGINNER',
      estimatedDuration: data.estimatedDuration ?? null,
      thumbnail: data.thumbnail ?? null,
      githubRepository: data.githubRepository ?? null,
      liveDemo: data.liveDemo ?? null,
      documentationUrl: data.documentationUrl ?? null,
      requirements: data.requirements ?? null,
      learningOutcomes: data.learningOutcomes ?? null,
      isPublished: data.isPublished ?? false,
    });

    projectEventEmitter.emit('project:created', {
      projectId: project.id,
      title: project.title,
      categoryId: project.categoryId,
    });

    return project;
  }

  async getProjectById(id: string, isAdmin = false) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_NOT_FOUND);
    }
    if (!isAdmin && !project.isPublished) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_NOT_FOUND);
    }
    return project;
  }

  async getProjects(
    query: {
      page?: number;
      limit?: number;
      categoryId?: string;
      difficulty?: string;
      technologyId?: string;
      search?: string;
      isPublished?: boolean;
    },
    isAdmin = false,
  ) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const filters: {
      categoryId?: string;
      difficulty?: string;
      technologyId?: string;
      search?: string;
      isPublished?: boolean;
    } = {
      categoryId: query.categoryId,
      difficulty: query.difficulty,
      technologyId: query.technologyId,
      search: query.search,
    };

    if (!isAdmin) {
      filters.isPublished = true;
    } else if (query.isPublished !== undefined) {
      filters.isPublished = query.isPublished;
    }

    const { data, total } = await projectRepository.findAll(filters, { page, limit });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateProject(id: string, data: UpdateProjectInput) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_NOT_FOUND);
    }

    if (data.slug && data.slug !== project.slug) {
      const slugExists = await projectRepository.existsBySlug(data.slug, id);
      if (slugExists) {
        throw new AppError(HTTP_STATUS.CONFLICT, PROJECT_MESSAGES.PROJECT_SLUG_EXISTS);
      }
    }

    if (data.categoryId && data.categoryId !== project.categoryId) {
      const category = await projectCategoryRepository.findById(data.categoryId);
      if (!category) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_CATEGORY_NOT_FOUND);
      }
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.categoryId) {
      delete updateData.categoryId;
      updateData.category = { connect: { id: data.categoryId } };
    }

    return projectRepository.update(id, updateData);
  }

  async deleteProject(id: string): Promise<void> {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_NOT_FOUND);
    }
    await projectRepository.delete(id);
  }

  async addTechnology(projectId: string, technologyId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_NOT_FOUND);
    }

    const tech = await projectTechnologyRepository.findById(technologyId);
    if (!tech) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TECHNOLOGY_NOT_FOUND);
    }

    const alreadyAdded = await projectRepository.hasTechnology(projectId, technologyId);
    if (alreadyAdded) {
      throw new AppError(HTTP_STATUS.CONFLICT, PROJECT_MESSAGES.TECHNOLOGY_ALREADY_ADDED);
    }

    await projectRepository.addTechnology(projectId, technologyId);
    return projectRepository.findById(projectId);
  }

  async removeTechnology(projectId: string, technologyId: string): Promise<void> {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_NOT_FOUND);
    }

    const linked = await projectRepository.hasTechnology(projectId, technologyId);
    if (!linked) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TECHNOLOGY_NOT_FOUND);
    }

    await projectRepository.removeTechnology(projectId, technologyId);
  }
}

export const projectService = new ProjectService();
