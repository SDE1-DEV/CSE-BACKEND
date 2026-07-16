import { Resume, ResumeSection, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class ResumeRepository {
  async create(data: Prisma.ResumeCreateInput): Promise<Resume> {
    return prisma.resume.create({ data, include: { sections: true } });
  }

  async findById(id: string): Promise<Resume | null> {
    return prisma.resume.findUnique({ where: { id }, include: { sections: { orderBy: { order: 'asc' } } } });
  }

  async findAllByUser(userId: string): Promise<Resume[]> {
    return prisma.resume.findMany({
      where: { userId },
      include: { sections: { orderBy: { order: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.ResumeUpdateInput): Promise<Resume> {
    return prisma.resume.update({ where: { id }, data, include: { sections: true } });
  }

  async delete(id: string): Promise<void> {
    await prisma.resume.delete({ where: { id } });
  }

  async clearDefaultForUser(userId: string): Promise<void> {
    await prisma.resume.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  }

  async setDefault(id: string): Promise<Resume> {
    return prisma.resume.update({ where: { id }, data: { isDefault: true } });
  }

  // Resume Sections
  async createSection(data: Prisma.ResumeSectionCreateInput): Promise<ResumeSection> {
    return prisma.resumeSection.create({ data });
  }

  async findSectionById(id: string): Promise<ResumeSection | null> {
    return prisma.resumeSection.findUnique({ where: { id } });
  }

  async updateSection(id: string, data: Prisma.ResumeSectionUpdateInput): Promise<ResumeSection> {
    return prisma.resumeSection.update({ where: { id }, data });
  }

  async deleteSection(id: string): Promise<void> {
    await prisma.resumeSection.delete({ where: { id } });
  }
}

export const resumeRepository = new ResumeRepository();
