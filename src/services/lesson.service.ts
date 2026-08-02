import { Role } from '@prisma/client';
import { prisma } from '../config/database';
import { lessonRepository } from '../repositories/lesson.repository';
import { sectionRepository } from '../repositories/section.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';
import {
  CreateLessonInput,
  UpdateLessonInput,
  UpdateProgressInput,
} from '../validators/lesson.validator';

export class LessonService {
  // ── Lesson CRUD ──────────────────────────────────────────────────────────────

  async createLesson(data: CreateLessonInput) {
    const section = await sectionRepository.findById(data.sectionId);
    if (!section) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.SECTION_NOT_FOUND);
    }

    const slugExists = await lessonRepository.existsBySlug(data.slug);
    if (slugExists) {
      throw new AppError(HTTP_STATUS.CONFLICT, LEARNING_MESSAGES.LESSON_SLUG_EXISTS);
    }

    return lessonRepository.create({
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      contentType: data.contentType,
      estimatedMinutes: data.estimatedMinutes ?? null,
      order: data.order ?? 0,
      isPublished: data.isPublished ?? false,
      section: { connect: { id: data.sectionId } },
    });
  }

  async getLessonById(id: string, userId?: string, role?: Role) {
    const lesson = await lessonRepository.findById(id, true);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    const isAdmin = (role === Role.SUPER_ADMIN || role === Role.MANAGER);
    if (!isAdmin && !lesson.isPublished) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    // Track recently viewed for authenticated users — fire-and-forget so it
    // never adds latency to the critical lesson-fetch path.
    if (userId) {
      void lessonRepository.upsertRecentlyViewed(userId, id).catch(() => { /* non-critical */ });
    }

    // ── Enrich with navigation, progress, bookmark, and roadmap context ───────
    const sectionId = lesson.sectionId;
    const roadmap = (lesson as any).section?.roadmap ?? null;
    const section = (lesson as any).section ?? null;

    // Get all published lessons in this section ordered by position for prev/next
    const siblingLessons = await prisma.lesson.findMany({
      where: {
        sectionId,
        deletedAt: null,
        ...(isAdmin ? {} : { isPublished: true }),
      },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });

    let prevLessonId: string | null = null;
    let nextLessonId: string | null = null;

    // Also look across sections (roadmap-wide navigation)
    if (roadmap?.id) {
      const allSections = await prisma.roadmapSection.findMany({
        where: { roadmapId: roadmap.id, deletedAt: null },
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            where: { deletedAt: null, ...(isAdmin ? {} : { isPublished: true }) },
            orderBy: { order: 'asc' },
            select: { id: true },
          },
        },
      });

      const allLessonIds: string[] = [];
      for (const sec of allSections) {
        for (const l of sec.lessons) {
          allLessonIds.push(l.id);
        }
      }

      const currentIdx = allLessonIds.indexOf(id);
      if (currentIdx > 0) prevLessonId = allLessonIds[currentIdx - 1];
      if (currentIdx >= 0 && currentIdx < allLessonIds.length - 1) {
        nextLessonId = allLessonIds[currentIdx + 1];
      }
    } else {
      // Fallback: only sibling navigation within section
      const currentIdx = siblingLessons.findIndex((l) => l.id === id);
      if (currentIdx > 0) prevLessonId = siblingLessons[currentIdx - 1].id;
      if (currentIdx >= 0 && currentIdx < siblingLessons.length - 1) {
        nextLessonId = siblingLessons[currentIdx + 1].id;
      }
    }

    // Progress & bookmark for authenticated users
    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    let isBookmarked = false;

    if (userId) {
      const [progress, bookmark] = await Promise.all([
        prisma.userProgress.findUnique({
          where: { userId_lessonId: { userId, lessonId: id } },
        }),
        prisma.bookmark.findFirst({ where: { userId, lessonId: id } }),
      ]);

      if (progress?.completed) {
        status = 'completed';
      } else if (progress?.lastOpened || (progress?.percentage ?? 0) > 0) {
        status = 'in_progress';
      }
      isBookmarked = !!bookmark;
    }

    // Estimate reading time from content (~200 words/min)
    const wordCount = ((lesson as any).content ?? '').split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

    return {
      ...lesson,
      // Navigation
      prevLessonId,
      nextLessonId,
      // Roadmap / section context
      roadmapId: roadmap?.id ?? null,
      roadmapTitle: roadmap?.title ?? null,
      roadmapSlug: roadmap?.slug ?? null,
      sectionTitle: section?.title ?? null,
      moduleTitle: section?.title ?? null,
      // User state
      status,
      isBookmarked,
      // Reading time
      readingTimeMinutes,
      // Difficulty derived from content type or default
      difficulty: 'beginner' as const,
    };
  }

  async getLessonsBySection(sectionId: string, role?: Role) {
    const section = await sectionRepository.findById(sectionId);
    if (!section) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.SECTION_NOT_FOUND);
    }

    const publishedOnly = !(role === Role.SUPER_ADMIN || role === Role.MANAGER);
    return lessonRepository.findBySectionId(sectionId, publishedOnly);
  }

  async updateLesson(id: string, data: UpdateLessonInput) {
    const lesson = await lessonRepository.findById(id);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    if (data.sectionId) {
      const section = await sectionRepository.findById(data.sectionId);
      if (!section) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.SECTION_NOT_FOUND);
      }
    }

    if (data.slug && data.slug !== lesson.slug) {
      const slugExists = await lessonRepository.existsBySlug(data.slug, id);
      if (slugExists) {
        throw new AppError(HTTP_STATUS.CONFLICT, LEARNING_MESSAGES.LESSON_SLUG_EXISTS);
      }
    }

    const updateData: Parameters<typeof lessonRepository.update>[1] = { ...data };
    if (data.sectionId) {
      delete (updateData as Record<string, unknown>).sectionId;
      (updateData as Record<string, unknown>).section = { connect: { id: data.sectionId } };
    }

    return lessonRepository.update(id, updateData);
  }

  async deleteLesson(id: string): Promise<void> {
    const lesson = await lessonRepository.findById(id);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }
    await lessonRepository.delete(id);
  }

  // ── Progress ─────────────────────────────────────────────────────────────────

  async markComplete(lessonId: string, userId: string) {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    // Resolve roadmapId for the progress record so stats queries can filter by roadmap
    const roadmapId = (lesson as any).section?.roadmapId ?? null;

    return lessonRepository.upsertProgress(userId, lessonId, {
      completed: true,
      completedAt: new Date(),
      percentage: 100,
      roadmapId,
    });
  }

  async updateProgress(lessonId: string, userId: string, data: UpdateProgressInput) {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    // Get existing progress to accumulate timeSpent
    const existing = await lessonRepository.findProgress(userId, lessonId);
    const totalTimeSpent = (existing?.timeSpent ?? 0) + (data.timeSpent ?? 0);

    return lessonRepository.upsertProgress(userId, lessonId, {
      percentage: data.watchPercentage,
      timeSpent: totalTimeSpent,
    });
  }

  // ── Bookmarks ────────────────────────────────────────────────────────────────

  async addBookmark(lessonId: string, userId: string) {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    const isBookmarked = await lessonRepository.isBookmarked(userId, lessonId);

    // Toggle behaviour: if already bookmarked, remove it
    if (isBookmarked) {
      await lessonRepository.removeBookmark(userId, lessonId);
      return { isBookmarked: false };
    }

    await lessonRepository.addBookmark(userId, lessonId);
    return { isBookmarked: true };
  }

  async removeBookmark(lessonId: string, userId: string): Promise<void> {
    const isBookmarked = await lessonRepository.isBookmarked(userId, lessonId);
    if (!isBookmarked) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.BOOKMARK_NOT_FOUND);
    }
    await lessonRepository.removeBookmark(userId, lessonId);
  }

  async getUserBookmarks(userId: string) {
    const bookmarks = await lessonRepository.getUserBookmarks(userId);
    // Shape each bookmark into what the frontend BookmarksPage expects
    return bookmarks.map((bm: any) => ({
      id: bm.id,
      type: 'lesson' as const,
      itemId: bm.lessonId,
      title: bm.lesson?.title ?? 'Untitled Lesson',
      description: bm.lesson?.description ?? null,
      thumbnail: null,
      roadmapTitle: bm.lesson?.section?.roadmap?.title ?? null,
      createdAt: bm.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
  }

  // ── Recently Viewed ──────────────────────────────────────────────────────────

  async getRecentlyViewed(userId: string) {
    const rows = await lessonRepository.getRecentlyViewed(userId, 20);
    return rows.map((rv: any) => ({
      id: rv.id,
      viewedAt: rv.viewedAt?.toISOString() ?? new Date().toISOString(),
      roadmapTitle: rv.lesson?.section?.roadmap?.title ?? null,
      lesson: {
        id: rv.lesson?.id,
        title: rv.lesson?.title ?? 'Untitled',
        slug: rv.lesson?.slug ?? '',
        description: rv.lesson?.description ?? null,
        estimatedMinutes: rv.lesson?.estimatedMinutes ?? 0,
        order: rv.lesson?.order ?? 0,
        status: 'not_started' as const,
      },
    }));
  }

  // ── Continue Learning ────────────────────────────────────────────────────────

  async getContinueLearning(userId: string) {
    const recentlyViewed = await lessonRepository.getContinueLearning(userId);
    if (!recentlyViewed || !recentlyViewed.lesson) return null;

    const lesson = recentlyViewed.lesson as any;
    const roadmap = lesson?.section?.roadmap ?? null;

    if (!roadmap) return null;

    // Fetch total and completed lessons in one batch instead of two separate COUNT queries
    const [allLessons, completedProgress] = await Promise.all([
      prisma.lesson.findMany({
        where: {
          section: { roadmapId: roadmap.id, deletedAt: null },
          deletedAt: null,
          isPublished: true,
        },
        select: { id: true },
      }),
      prisma.userProgress.findMany({
        where: {
          userId,
          completed: true,
          lesson: { section: { roadmapId: roadmap.id, deletedAt: null }, deletedAt: null },
        },
        select: { id: true },
      }),
    ]);

    const totalLessons = allLessons.length;
    const completedLessons = completedProgress.length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      roadmap: {
        id: roadmap.id,
        slug: roadmap.slug,
        title: roadmap.title,
        description: roadmap.description,
        difficulty: roadmap.difficulty?.toLowerCase() ?? 'beginner',
        estimatedHours: roadmap.estimatedHours,
        lessonCount: totalLessons,
        progress,
        completedLessons,
        thumbnail: roadmap.thumbnail,
        isPublished: roadmap.isPublished,
        category: lesson?.section?.roadmap?.category ?? null,
        tags: roadmap.tags ? roadmap.tags.split(',').map((t: string) => t.trim()) : [],
      },
      lesson: {
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        estimatedMinutes: lesson.estimatedMinutes,
        order: lesson.order,
        sectionTitle: lesson.section?.title ?? null,
        roadmapSlug: roadmap.slug,
        roadmapTitle: roadmap.title,
      },
      progress,
      lastActivityAt: recentlyViewed.viewedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}

export const lessonService = new LessonService();
