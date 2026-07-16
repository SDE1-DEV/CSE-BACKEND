import { Role } from '@prisma/client';
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

    const isAdmin = role === Role.ADMIN;
    if (!isAdmin && !lesson.isPublished) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    // Track recently viewed for authenticated users
    if (userId) {
      await lessonRepository.upsertRecentlyViewed(userId, id);
    }

    return lesson;
  }

  async getLessonsBySection(sectionId: string, role?: Role) {
    const section = await sectionRepository.findById(sectionId);
    if (!section) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.SECTION_NOT_FOUND);
    }

    const publishedOnly = role !== Role.ADMIN;
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

    return lessonRepository.upsertProgress(userId, lessonId, {
      completed: true,
      completedAt: new Date(),
      watchPercentage: 100,
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
      watchPercentage: data.watchPercentage,
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
    if (isBookmarked) {
      throw new AppError(HTTP_STATUS.CONFLICT, LEARNING_MESSAGES.BOOKMARK_EXISTS);
    }

    return lessonRepository.addBookmark(userId, lessonId);
  }

  async removeBookmark(lessonId: string, userId: string): Promise<void> {
    const isBookmarked = await lessonRepository.isBookmarked(userId, lessonId);
    if (!isBookmarked) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.BOOKMARK_NOT_FOUND);
    }
    await lessonRepository.removeBookmark(userId, lessonId);
  }

  async getUserBookmarks(userId: string) {
    return lessonRepository.getUserBookmarks(userId);
  }

  // ── Recently Viewed ──────────────────────────────────────────────────────────

  async getRecentlyViewed(userId: string) {
    return lessonRepository.getRecentlyViewed(userId, 20);
  }

  // ── Continue Learning ────────────────────────────────────────────────────────

  async getContinueLearning(userId: string) {
    return lessonRepository.getContinueLearning(userId);
  }
}

export const lessonService = new LessonService();
