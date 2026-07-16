import { Resume, ResumeSection } from '@prisma/client';
import { resumeRepository } from '../repositories/resume.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PLACEMENT_MESSAGES } from '../constants';
import { CreateResumeInput, UpdateResumeInput } from '../validators/resume.validator';
import { CreateResumeSectionInput, UpdateResumeSectionInput } from '../validators/resume-section.validator';
import { Prisma } from '@prisma/client';

export class ResumeService {
  async create(userId: string, data: CreateResumeInput): Promise<Resume> {
    // Ensure only one default resume per user
    if (data.isDefault) {
      await resumeRepository.clearDefaultForUser(userId);
    }

    return resumeRepository.create({
      user: { connect: { id: userId } },
      title: data.title,
      template: data.template ?? 'default',
      resumeUrl: data.resumeUrl ?? null,
      atsScore: data.atsScore ?? null,
      isDefault: data.isDefault ?? false,
    });
  }

  async getAll(userId: string): Promise<Resume[]> {
    return resumeRepository.findAllByUser(userId);
  }

  async getById(id: string, userId: string): Promise<Resume> {
    const resume = await resumeRepository.findById(id);
    if (!resume) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.RESUME_NOT_FOUND);
    if (resume.userId !== userId) throw new AppError(HTTP_STATUS.FORBIDDEN, PLACEMENT_MESSAGES.RESUME_FORBIDDEN);
    return resume;
  }

  async update(id: string, userId: string, data: UpdateResumeInput): Promise<Resume> {
    const resume = await resumeRepository.findById(id);
    if (!resume) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.RESUME_NOT_FOUND);
    if (resume.userId !== userId) throw new AppError(HTTP_STATUS.FORBIDDEN, PLACEMENT_MESSAGES.RESUME_FORBIDDEN);

    if (data.isDefault) {
      await resumeRepository.clearDefaultForUser(userId);
    }

    return resumeRepository.update(id, data);
  }

  async delete(id: string, userId: string): Promise<void> {
    const resume = await resumeRepository.findById(id);
    if (!resume) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.RESUME_NOT_FOUND);
    if (resume.userId !== userId) throw new AppError(HTTP_STATUS.FORBIDDEN, PLACEMENT_MESSAGES.RESUME_FORBIDDEN);
    await resumeRepository.delete(id);
  }

  async setDefault(id: string, userId: string): Promise<Resume> {
    const resume = await resumeRepository.findById(id);
    if (!resume) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.RESUME_NOT_FOUND);
    if (resume.userId !== userId) throw new AppError(HTTP_STATUS.FORBIDDEN, PLACEMENT_MESSAGES.RESUME_FORBIDDEN);

    await resumeRepository.clearDefaultForUser(userId);
    return resumeRepository.setDefault(id);
  }

  // Resume Sections
  async createSection(userId: string, data: CreateResumeSectionInput): Promise<ResumeSection> {
    const resume = await resumeRepository.findById(data.resumeId);
    if (!resume) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.RESUME_NOT_FOUND);
    if (resume.userId !== userId) throw new AppError(HTTP_STATUS.FORBIDDEN, PLACEMENT_MESSAGES.RESUME_SECTION_FORBIDDEN);

    return resumeRepository.createSection({
      resume: { connect: { id: data.resumeId } },
      sectionType: data.sectionType,
      content: data.content as Prisma.InputJsonValue,
      order: data.order ?? 0,
    });
  }

  async updateSection(id: string, userId: string, data: UpdateResumeSectionInput): Promise<ResumeSection> {
    const section = await resumeRepository.findSectionById(id);
    if (!section) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.RESUME_SECTION_NOT_FOUND);

    const resume = await resumeRepository.findById(section.resumeId);
    if (!resume || resume.userId !== userId) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PLACEMENT_MESSAGES.RESUME_SECTION_FORBIDDEN);
    }

    return resumeRepository.updateSection(id, {
      ...data,
      content: data.content ? (data.content as Prisma.InputJsonValue) : undefined,
    });
  }

  async deleteSection(id: string, userId: string): Promise<void> {
    const section = await resumeRepository.findSectionById(id);
    if (!section) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.RESUME_SECTION_NOT_FOUND);

    const resume = await resumeRepository.findById(section.resumeId);
    if (!resume || resume.userId !== userId) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PLACEMENT_MESSAGES.RESUME_SECTION_FORBIDDEN);
    }

    await resumeRepository.deleteSection(id);
  }
}

export const resumeService = new ResumeService();
