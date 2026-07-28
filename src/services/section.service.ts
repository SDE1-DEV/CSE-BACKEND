import { RoadmapSection } from '@prisma/client';
import { sectionRepository } from '../repositories/section.repository';
import { roadmapRepository } from '../repositories/roadmap.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';
import { CreateSectionInput, UpdateSectionInput } from '../validators/section.validator';
import { Role } from '@prisma/client';

export class SectionService {
  async createSection(data: CreateSectionInput): Promise<RoadmapSection> {
    const roadmap = await roadmapRepository.findById(data.roadmapId);
    if (!roadmap) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
    }

    return sectionRepository.create({
      title: data.title,
      description: data.description ?? null,
      order: data.order ?? 0,
      roadmap: { connect: { id: data.roadmapId } },
    });
  }

  async getSectionsByRoadmap(roadmapId: string, role?: Role) {
    const roadmap = await roadmapRepository.findById(roadmapId);
    if (!roadmap) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
    }

    const isAdmin = (role === Role.SUPER_ADMIN || role === Role.MANAGER);

    if (!isAdmin && !roadmap.isPublished) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
    }

    if (isAdmin) {
      return sectionRepository.findByRoadmapId(roadmapId);
    }
    return sectionRepository.findByRoadmapIdPublished(roadmapId);
  }

  async updateSection(id: string, data: UpdateSectionInput): Promise<RoadmapSection> {
    const section = await sectionRepository.findById(id);
    if (!section) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.SECTION_NOT_FOUND);
    }

    return sectionRepository.update(id, data);
  }

  async deleteSection(id: string): Promise<void> {
    const section = await sectionRepository.findById(id);
    if (!section) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.SECTION_NOT_FOUND);
    }
    await sectionRepository.delete(id);
  }
}

export const sectionService = new SectionService();
