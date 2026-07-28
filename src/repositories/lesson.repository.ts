import { Lesson, UserProgress, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class LessonRepository {
  // ── Lessons ─────────────────────────────────────────────────────────────────

  async create(data: Prisma.LessonCreateInput): Promise<Lesson> {
    return prisma.lesson.create({ data });
  }

  async findById(id: string, withResources = false) {
    return prisma.lesson.findUnique({
      where: { id },
      include: withResources
        ? {
            resources: { orderBy: { createdAt: 'asc' } },
            section: {
              include: {
                roadmap: { include: { category: true } },
              },
            },
          }
        : {
            section: {
              include: { roadmap: { include: { category: true } } },
            },
          },
    });
  }

  async findBySlug(slug: string) {
    return prisma.lesson.findUnique({
      where: { slug },
      include: {
        resources: { orderBy: { createdAt: 'asc' } },
        section: { include: { roadmap: { include: { category: true } } } },
      },
    });
  }

  async findBySectionId(sectionId: string, publishedOnly = false) {
    return prisma.lesson.findMany({
      where: {
        sectionId,
        ...(publishedOnly ? { isPublished: true } : {}),
      },
      orderBy: { order: 'asc' },
      include: { resources: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async update(id: string, data: Prisma.LessonUpdateInput): Promise<Lesson> {
    return prisma.lesson.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.lesson.delete({ where: { id } });
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.LessonWhereInput = { slug };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await prisma.lesson.count({ where });
    return count > 0;
  }

  async searchByTitle(query: string, publishedOnly = true) {
    return prisma.lesson.findMany({
      where: {
        ...(publishedOnly ? { isPublished: true } : {}),
        title: { contains: query, mode: 'insensitive' },
      },
      include: {
        section: { include: { roadmap: true } },
      },
      take: 10,
    });
  }

  // ── Lesson Progress ──────────────────────────────────────────────────────────

  async upsertProgress(
    userId: string,
    lessonId: string,
    data: { watchPercentage?: number; timeSpent?: number; completed?: boolean; completedAt?: Date | null },
  ): Promise<UserProgress> {
    return prisma.userProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { ...data, updatedAt: new Date() },
      create: { userId, lessonId, ...data },
    });
  }

  async findProgress(userId: string, lessonId: string): Promise<UserProgress | null> {
    return prisma.userProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
  }

  // ── Bookmarks ────────────────────────────────────────────────────────────────

  async addBookmark(userId: string, lessonId: string) {
    return prisma.bookmark.create({ data: { userId, lessonId } });
  }

  async removeBookmark(userId: string, lessonId: string): Promise<void> {
    await prisma.bookmark.deleteMany({ where: { userId, lessonId } });
  }

  async isBookmarked(userId: string, lessonId: string): Promise<boolean> {
    const count = await prisma.bookmark.count({ where: { userId, lessonId } });
    return count > 0;
  }

  async getUserBookmarks(userId: string) {
    return prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        lesson: {
          include: {
            section: { include: { roadmap: { include: { category: true } } } },
          },
        },
      },
    });
  }

  // ── Recently Viewed ──────────────────────────────────────────────────────────

  async upsertRecentlyViewed(userId: string, lessonId: string) {
    return prisma.recentlyViewed.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { viewedAt: new Date() },
      create: { userId, lessonId },
    });
  }

  async getRecentlyViewed(userId: string, limit = 10) {
    return prisma.recentlyViewed.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: limit,
      include: {
        lesson: {
          include: {
            section: { include: { roadmap: { include: { category: true } } } },
          },
        },
      },
    });
  }

  // ── Continue Learning ────────────────────────────────────────────────────────

  async getContinueLearning(userId: string) {
    // Most recent incomplete lesson that was viewed
    return prisma.recentlyViewed.findFirst({
      where: {
        userId,
        lesson: {
          isPublished: true,
          progress: {
            none: {
              userId,
              completed: true,
            },
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
      include: {
        lesson: {
          include: {
            resources: { orderBy: { createdAt: 'asc' } },
            section: { include: { roadmap: { include: { category: true } } } },
            progress: { where: { userId } },
          },
        },
      },
    });
  }
}

export const lessonRepository = new LessonRepository();
