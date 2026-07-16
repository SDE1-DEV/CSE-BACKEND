import { LearningResource, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class ResourceRepository {
  async create(data: Prisma.LearningResourceCreateInput): Promise<LearningResource> {
    return prisma.learningResource.create({ data });
  }

  async findById(id: string): Promise<LearningResource | null> {
    return prisma.learningResource.findUnique({ where: { id } });
  }

  async findByLessonId(lessonId: string): Promise<LearningResource[]> {
    return prisma.learningResource.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, data: Prisma.LearningResourceUpdateInput): Promise<LearningResource> {
    return prisma.learningResource.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.learningResource.delete({ where: { id } });
  }
}

export const resourceRepository = new ResourceRepository();
