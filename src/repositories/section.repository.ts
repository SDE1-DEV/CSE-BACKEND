import { Prisma, RoadmapSection } from '@prisma/client';
import { prisma } from '../config/database';

export class SectionRepository {
  async create(data: Prisma.RoadmapSectionCreateInput): Promise<RoadmapSection> {
    return prisma.roadmapSection.create({ data });
  }

  async findById(id: string): Promise<RoadmapSection | null> {
    return prisma.roadmapSection.findUnique({ where: { id } });
  }

  async findByRoadmapId(roadmapId: string) {
    return prisma.roadmapSection.findMany({
      where: { roadmapId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          where: {},
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            contentType: true,
            estimatedMinutes: true,
            order: true,
            isPublished: true,
          },
        },
      },
    });
  }

  async findByRoadmapIdPublished(roadmapId: string) {
    return prisma.roadmapSection.findMany({
      where: { roadmapId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            contentType: true,
            estimatedMinutes: true,
            order: true,
            isPublished: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.RoadmapSectionUpdateInput): Promise<RoadmapSection> {
    return prisma.roadmapSection.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.roadmapSection.delete({ where: { id } });
  }
}

export const sectionRepository = new SectionRepository();
