import { ProjectTechnology } from '@prisma/client';
import { projectTechnologyRepository } from '../repositories/project-technology.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PROJECT_MESSAGES } from '../constants';
import type { CreateTechnologyInput, UpdateTechnologyInput } from '../validators/project-technology.validator';

export class ProjectTechnologyService {
  async createTechnology(data: CreateTechnologyInput): Promise<ProjectTechnology> {
    const slugExists = await projectTechnologyRepository.existsBySlug(data.slug);
    if (slugExists) {
      throw new AppError(HTTP_STATUS.CONFLICT, PROJECT_MESSAGES.TECHNOLOGY_SLUG_EXISTS);
    }

    const nameExists = await projectTechnologyRepository.existsByName(data.name);
    if (nameExists) {
      throw new AppError(HTTP_STATUS.CONFLICT, PROJECT_MESSAGES.TECHNOLOGY_NAME_EXISTS);
    }

    return projectTechnologyRepository.create({
      name: data.name,
      slug: data.slug,
      icon: data.icon ?? null,
    });
  }

  async getTechnologyById(id: string): Promise<ProjectTechnology> {
    const tech = await projectTechnologyRepository.findById(id);
    if (!tech) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TECHNOLOGY_NOT_FOUND);
    }
    return tech;
  }

  async getTechnologies(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const { data, total } = await projectTechnologyRepository.findAll(
      { search: query.search },
      { page, limit },
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateTechnology(id: string, data: UpdateTechnologyInput): Promise<ProjectTechnology> {
    const tech = await projectTechnologyRepository.findById(id);
    if (!tech) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TECHNOLOGY_NOT_FOUND);
    }

    if (data.slug && data.slug !== tech.slug) {
      const slugExists = await projectTechnologyRepository.existsBySlug(data.slug, id);
      if (slugExists) {
        throw new AppError(HTTP_STATUS.CONFLICT, PROJECT_MESSAGES.TECHNOLOGY_SLUG_EXISTS);
      }
    }

    if (data.name && data.name !== tech.name) {
      const nameExists = await projectTechnologyRepository.existsByName(data.name, id);
      if (nameExists) {
        throw new AppError(HTTP_STATUS.CONFLICT, PROJECT_MESSAGES.TECHNOLOGY_NAME_EXISTS);
      }
    }

    return projectTechnologyRepository.update(id, data);
  }

  async deleteTechnology(id: string): Promise<void> {
    const tech = await projectTechnologyRepository.findById(id);
    if (!tech) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TECHNOLOGY_NOT_FOUND);
    }
    await projectTechnologyRepository.delete(id);
  }
}

export const projectTechnologyService = new ProjectTechnologyService();
