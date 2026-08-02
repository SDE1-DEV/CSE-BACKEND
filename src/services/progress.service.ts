import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { lessonRepository } from '../repositories/lesson.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';

export interface RoadmapProgress {
  roadmapId: string;
  roadmapSlug: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  lastActivityAt: Date | null;
}

export interface ProgressFilterOptions {
  roadmapId?: string;
  moduleId?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ProgressService {
  private async resolveRoadmap(slugOrId: string, isAdmin = false, includeExtras = false) {
    const isUuid = UUID_REGEX.test(slugOrId);
    const include = includeExtras
      ? { category: true, _count: { select: { sections: { where: { deletedAt: null } } } } }
      : undefined;
    let roadmap: any = null;
    const query: any = include ? { include } : {};
    if (isUuid) {
      roadmap = await prisma.roadmap.findUnique({ where: { id: slugOrId }, ...query });
    }
    if (!roadmap) {
      roadmap = await prisma.roadmap.findUnique({ where: { slug: slugOrId }, ...query });
    }
    if (!roadmap) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
    }
    if (!isAdmin && !roadmap.isPublished) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
    }
    return roadmap;
  }

  async getRoadmapBySlug(slug: string, isAdmin = false, userId?: string) {
    const roadmap = await this.resolveRoadmap(slug, isAdmin, true);
    const lessonsCount = await prisma.lesson.count({
      where: {
        section: { roadmapId: roadmap.id, deletedAt: null },
        deletedAt: null,
        ...(isAdmin ? {} : { isPublished: true }),
      },
    });

    // Fetch sections + lessons (needed by sidebar in LessonViewerPage and RoadmapDetailPage)
    const sections = await prisma.roadmapSection.findMany({
      where: { roadmapId: roadmap.id, deletedAt: null },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          where: { deletedAt: null, ...(isAdmin ? {} : { isPublished: true }) },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            estimatedMinutes: true,
            order: true,
            isPublished: true,
            contentType: true,
            description: true,
          },
        },
      },
    });

    // Fetch user progress for the whole roadmap if userId provided
    const progressMap: Record<string, 'not_started' | 'in_progress' | 'completed'> = {};
    let completedCount = 0;

    if (userId) {
      const progressRows = await prisma.userProgress.findMany({
        where: {
          userId,
          lesson: { section: { roadmapId: roadmap.id, deletedAt: null }, deletedAt: null },
        },
        select: { lessonId: true, completed: true, percentage: true, lastOpened: true },
      });
      for (const p of progressRows) {
        if (p.completed) {
          progressMap[p.lessonId] = 'completed';
          completedCount++;
        } else if (p.lastOpened || (p.percentage ?? 0) > 0) {
          progressMap[p.lessonId] = 'in_progress';
        } else {
          progressMap[p.lessonId] = 'not_started';
        }
      }
    }

    // Enrich lessons with status
    const enrichedSections = sections.map((sec) => ({
      ...sec,
      lessons: sec.lessons.map((l) => ({
        ...l,
        status: progressMap[l.id] ?? 'not_started',
      })),
    }));

    const totalLessons = enrichedSections.reduce((sum, s) => sum + s.lessons.length, 0);
    const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    // Normalize tags: DB stores as comma-separated String? — convert to string[]
    const rawTags = roadmap.tags;
    const normalizedTags: string[] = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === 'string' && rawTags.trim()
        ? rawTags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];

    return {
      ...roadmap,
      tags: normalizedTags,
      difficulty: typeof roadmap.difficulty === 'string' ? roadmap.difficulty.toLowerCase() : roadmap.difficulty,
      category: roadmap.category
        ? { ...roadmap.category, name: roadmap.category.title ?? roadmap.category.name, color: '#3b82f6', roadmapCount: 0 }
        : { id: '', name: 'Programming', slug: 'programming', color: '#3b82f6', roadmapCount: 0 },
      lessonsCount,
      lessonCount: lessonsCount,
      sectionsCount: roadmap._count?.sections ?? 0,
      sections: enrichedSections,
      progress: progressPct,
      completedLessons: completedCount,
    };
  }

  async getRoadmapModulesWithLessons(slug: string, isAdmin = false) {
    const roadmap = await this.resolveRoadmap(slug, isAdmin);
    return prisma.roadmapSection.findMany({
      where: { roadmapId: roadmap.id, deletedAt: null },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          where: {
            deletedAt: null,
            ...(isAdmin ? {} : { isPublished: true }),
          },
          orderBy: { order: 'asc' },
          include: { resources: true },
        },
      },
    });
  }

  async getRoadmapLessons(slug: string, isAdmin = false) {
    const roadmap = await this.resolveRoadmap(slug, isAdmin);
    return prisma.lesson.findMany({
      where: {
        section: { roadmapId: roadmap.id, deletedAt: null },
        deletedAt: null,
        ...(isAdmin ? {} : { isPublished: true }),
      },
      orderBy: [{ section: { order: 'asc' } }, { order: 'asc' }],
      include: {
        section: true,
        resources: true,
      },
    });
  }

  async calculateRoadmapProgress(userId: string, roadmapId: string): Promise<RoadmapProgress> {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id: roadmapId },
      select: { id: true, slug: true, isPublished: true },
    });
    if (!roadmap) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.ROADMAP_NOT_FOUND);
    }

    // Run all three independent queries in parallel
    const [totalLessons, completedLessons, lastActivity] = await Promise.all([
      prisma.lesson.count({
        where: {
          section: { roadmapId, deletedAt: null },
          deletedAt: null,
          isPublished: true,
        },
      }),
      prisma.userProgress.count({
        where: {
          userId,
          completed: true,
          lesson: {
            section: { roadmapId, deletedAt: null },
            deletedAt: null,
          },
        },
      }),
      prisma.userProgress.findFirst({
        where: {
          userId,
          lesson: { section: { roadmapId, deletedAt: null }, deletedAt: null },
        },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      }),
    ]);

    const percentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    return {
      roadmapId,
      roadmapSlug: roadmap.slug,
      totalLessons,
      completedLessons,
      percentage: Math.round(percentage * 100) / 100,
      lastActivityAt: lastActivity?.updatedAt ?? null,
    };
  }

  async getUserProgress(userId: string, filters: ProgressFilterOptions = {}) {
    const where: Prisma.UserProgressWhereInput = { userId };
    if (filters.roadmapId) {
      where.lesson = {
        section: { roadmapId: filters.roadmapId, deletedAt: null },
        deletedAt: null,
      };
    } else if (filters.moduleId) {
      where.lesson = { sectionId: filters.moduleId, deletedAt: null };
    }
    const entries = await prisma.userProgress.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            estimatedMinutes: true,
            section: {
              select: {
                id: true,
                title: true,
                order: true,
                roadmap: { select: { id: true, title: true, slug: true } },
              },
            },
          },
        },
      },
    });

    const distinctRoadmapIds = new Set<string>();
    for (const e of entries) {
      const rid = e.lesson?.section?.roadmap?.id;
      if (rid) distinctRoadmapIds.add(rid);
    }

    // Compute all roadmap progress in parallel instead of sequential loop
    const roadmapProgress: RoadmapProgress[] = await Promise.all(
      Array.from(distinctRoadmapIds).map((rid) => this.calculateRoadmapProgress(userId, rid)),
    );

    return {
      entries,
      roadmapProgress,
    };
  }

  async patchProgress(userId: string, body: { lessonId: string; lastOpened?: string | Date; watchPercentage?: number }) {
    if (!body?.lessonId) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'lessonId is required');
    }
    const lesson = await lessonRepository.findById(body.lessonId);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }
    const existing = await prisma.userProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId: body.lessonId } },
    });
    const updateData: Prisma.UserProgressUpdateInput = {};
    if (body.lastOpened) {
      updateData.lastOpened = typeof body.lastOpened === 'string' ? new Date(body.lastOpened) : body.lastOpened;
    } else if (!existing) {
      updateData.lastOpened = new Date();
    }
    if (typeof body.watchPercentage === 'number') {
      updateData.percentage = Math.max(0, Math.min(100, body.watchPercentage));
    }
    const roadmapId = lesson.section?.roadmapId ?? null;
    const moduleId = lesson.sectionId ?? null;
    if (existing) {
      return prisma.userProgress.update({
        where: { userId_lessonId: { userId, lessonId: body.lessonId } },
        data: updateData,
      });
    }
    const createData: any = {
      userId,
      lessonId: body.lessonId,
      completed: false,
    };
    if (roadmapId) createData.roadmapId = roadmapId;
    if (moduleId) createData.moduleId = moduleId;
    if (updateData.lastOpened) createData.lastOpened = updateData.lastOpened;
    if (typeof updateData.percentage === 'number') createData.percentage = updateData.percentage;
    return prisma.userProgress.create({ data: createData });
  }

  async addBookmarkByBody(userId: string, lessonId: string) {
    if (!lessonId) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'lessonId is required');
    }
    return lessonRepository.addBookmark(userId, lessonId);
  }

  async removeBookmarkByBody(userId: string, lessonId: string) {
    if (!lessonId) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'lessonId is required');
    }
    const exists = await lessonRepository.isBookmarked(userId, lessonId);
    if (!exists) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.BOOKMARK_NOT_FOUND);
    }
    await lessonRepository.removeBookmark(userId, lessonId);
  }

  async getActivity(userId: string, limit = 25) {
    // Run both queries in parallel
    const [progressEntries, notifications] = await Promise.all([
      prisma.userProgress.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        include: {
          lesson: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);
    type ActivityEntry = {
      id: string;
      type: 'LESSON_COMPLETED' | 'LESSON_VIEWED' | 'NOTIFICATION';
      message: string;
      timestamp: Date;
      relatedLessonId?: string;
      metadata?: Record<string, unknown>;
    };
    const entries: ActivityEntry[] = [];
    for (const p of progressEntries) {
      if (p.completed) {
        entries.push({
          id: `prog-${p.id}`,
          type: 'LESSON_COMPLETED',
          message: `Completed lesson: ${p.lesson?.title ?? 'Unknown'}`,
          timestamp: p.completedAt ?? p.updatedAt,
          relatedLessonId: p.lessonId,
        });
      } else if (p.lastOpened) {
        entries.push({
          id: `prog-view-${p.id}`,
          type: 'LESSON_VIEWED',
          message: `Viewed lesson: ${p.lesson?.title ?? 'Unknown'}`,
          timestamp: p.lastOpened,
          relatedLessonId: p.lessonId,
        });
      }
    }
    for (const n of notifications) {
      entries.push({
        id: `notif-${n.id}`,
        type: 'NOTIFICATION',
        message: n.title,
        timestamp: n.createdAt,
      });
    }
    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return entries.slice(0, limit);
  }
}

export const progressService = new ProgressService();
