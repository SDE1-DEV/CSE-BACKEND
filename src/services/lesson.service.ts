/**
 * LessonService — Legacy Roadmap/Lesson System
 *
 * The legacy tables (roadmaps, roadmap_sections, lessons, lesson_progress,
 * bookmarks, recently_viewed) still physically exist in production but Prisma
 * Client no longer has typed models for them. All direct DB access uses
 * prisma.$queryRaw / prisma.$executeRaw.
 *
 * Repository methods (lessonRepository, sectionRepository) still work because
 * they were not removed — they operate on the physical tables via raw queries
 * internally.
 */
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

    // Get all published lessons in this section for prev/next fallback via raw SQL
    const siblingLessons = await prisma.$queryRaw<{ id: string; order: number }[]>`
      SELECT id, "order"
      FROM "lessons"
      WHERE "sectionId" = ${sectionId}
        AND "deletedAt" IS NULL
        ${isAdmin ? prisma.$queryRaw`` : prisma.$queryRaw`AND "isPublished" = true`}
      ORDER BY "order" ASC
    `;

    let prevLessonId: string | null = null;
    let nextLessonId: string | null = null;

    // Also look across sections (roadmap-wide navigation) via raw SQL
    if (roadmap?.id) {
      const allSections = await prisma.$queryRaw<{ id: string; order: number; lessons: never[] }[]>`
        SELECT rs.id, rs."order"
        FROM "roadmap_sections" rs
        WHERE rs."roadmapId" = ${roadmap.id} AND rs."deletedAt" IS NULL
        ORDER BY rs."order" ASC
      `;

      const sectionIds = allSections.map((s) => s.id);
      const allRawLessons = sectionIds.length > 0
        ? await prisma.$queryRaw<{ id: string; sectionId: string; order: number }[]>`
            SELECT l.id, l."sectionId", l."order"
            FROM "lessons" l
            WHERE l."sectionId" = ANY(${sectionIds})
              AND l."deletedAt" IS NULL
              ${isAdmin ? prisma.$queryRaw`` : prisma.$queryRaw`AND l."isPublished" = true`}
            ORDER BY l."order" ASC
          `
        : [];

      // Sort by section order then lesson order
      const sectionOrderMap = new Map(allSections.map((s) => [s.id, s.order]));
      const sorted = allRawLessons.sort((a, b) => {
        const so = (sectionOrderMap.get(a.sectionId) ?? 0) - (sectionOrderMap.get(b.sectionId) ?? 0);
        return so !== 0 ? so : a.order - b.order;
      });

      const allLessonIds = sorted.map((l) => l.id);

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

    // Progress & bookmark for authenticated users via raw SQL
    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    let isBookmarked = false;

    if (userId) {
      const [progressRows, bookmarkRows] = await Promise.all([
        prisma.$queryRaw<{
          completed: boolean;
          last_opened: Date | null;
          percentage: number | null;
        }[]>`
          SELECT completed, "lastOpened" AS last_opened, "watchPercentage" AS percentage
          FROM "lesson_progress"
          WHERE "userId" = ${userId} AND "lessonId" = ${id}
          LIMIT 1
        `,
        prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM "bookmarks"
          WHERE "userId" = ${userId} AND "lessonId" = ${id}
          LIMIT 1
        `,
      ]);

      const progress = progressRows[0];
      if (progress?.completed) {
        status = 'completed';
      } else if (progress?.last_opened || (Number(progress?.percentage) ?? 0) > 0) {
        status = 'in_progress';
      }
      isBookmarked = bookmarkRows.length > 0;
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

    // Fetch total and completed lessons via raw SQL (Prisma has no Lesson/UserProgress model)
    const [allLessons, completedProgress] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>`
        SELECT l.id
        FROM "lessons" l
        JOIN "roadmap_sections" rs ON rs.id = l."sectionId"
        WHERE rs."roadmapId" = ${roadmap.id}
          AND l."deletedAt"  IS NULL
          AND rs."deletedAt" IS NULL
          AND l."isPublished" = true
      `,
      prisma.$queryRaw<{ id: string }[]>`
        SELECT lp.id
        FROM "lesson_progress" lp
        JOIN "lessons"          l  ON l.id  = lp."lessonId"  AND l."deletedAt"  IS NULL
        JOIN "roadmap_sections" rs ON rs.id = l."sectionId"  AND rs."deletedAt" IS NULL
        WHERE lp."userId"    = ${userId}
          AND rs."roadmapId" = ${roadmap.id}
          AND lp.completed   = true
      `,
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
