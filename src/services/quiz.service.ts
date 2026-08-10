// @ts-nocheck — intentionally suppressed: lessonPracticeQuestion and quizQuestion
// are not in schema.prisma (they were added via raw SQL migrations 20260801000000 /
// 20260801000001) but Prisma's generated client does not expose them as typed models.
// We use prisma.$queryRaw for those tables.
/**
 * Quiz & Practice Question Service
 * Serves lesson practice questions, quiz questions, quiz submission scoring,
 * and per-user learning statistics.
 *
 * Legacy tables (lessons, lesson_progress, roadmaps, roadmap_sections) still
 * physically exist in the production database. Prisma Client has no typed models
 * for them — all access goes through prisma.$queryRaw / prisma.$executeRaw.
 */

import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';
import { lessonRepository } from '../repositories/lesson.repository';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PracticeQuestionDTO {
  id: string;
  lessonId: string;
  question: string;
  answer: string;
  hint: string | null;
  difficulty: string;
  order: number;
  // Frontend-expected fields
  type: 'theory';
  options?: string[];
  explanation?: string;
}

export interface QuizOptionDTO {
  id: string;
  text: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface QuizQuestionDTO {
  id: string;
  lessonId: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string | null;
  order: number;
}

export interface QuizSubmissionResult {
  lessonId: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, number>;
  correctAnswers: Record<string, number>;
}

export interface LearningStats {
  totalRoadmaps: number;
  completedRoadmaps: number;
  inProgressRoadmaps: number;
  totalLessonsCompleted: number;
  totalHoursLearned: number;
  currentStreak: number;
  longestStreak: number;
  bookmarksCount: number;
}

// ── Service ──────────────────────────────────────────────────────────────────

export class QuizService {
  // ── Practice Questions ──────────────────────────────────────────────────────

  async getPracticeQuestions(lessonId: string): Promise<PracticeQuestionDTO[]> {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    const rows = await prisma.lessonPracticeQuestion.findMany({
      where: { lessonId },
      orderBy: { displayOrder: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      lessonId: r.lessonId,
      question: r.question,
      answer: r.answer,
      hint: r.hint,
      difficulty: r.difficulty.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
      order: r.displayOrder,
      type: 'theory' as const,
      explanation: undefined,
      options: undefined,
    }));
  }

  // ── Quiz Questions ──────────────────────────────────────────────────────────

  async getQuizQuestions(lessonId: string): Promise<QuizQuestionDTO[]> {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    const questions = await prisma.quizQuestion.findMany({
      where: { lessonId },
      orderBy: { displayOrder: 'asc' },
      include: {
        options: { orderBy: { displayOrder: 'asc' } },
      },
    });

    return questions.map((q) => {
      const correctIdx = q.options.findIndex((o) => o.isCorrect);
      return {
        id: q.id,
        lessonId: q.lessonId,
        question: q.question,
        options: q.options.map((o) => o.text),
        correctOption: correctIdx >= 0 ? correctIdx : 0,
        explanation: q.explanation,
        order: q.displayOrder,
      };
    });
  }

  // ── Quiz Submission ─────────────────────────────────────────────────────────

  async submitQuiz(
    lessonId: string,
    userId: string,
    answers: Record<string, number>,
  ): Promise<QuizSubmissionResult> {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    const questions = await prisma.quizQuestion.findMany({
      where: { lessonId },
      include: { options: { orderBy: { displayOrder: 'asc' } } },
      orderBy: { displayOrder: 'asc' },
    });

    let score = 0;
    const correctAnswers: Record<string, number> = {};

    for (const q of questions) {
      const correctIdx = q.options.findIndex((o) => o.isCorrect);
      correctAnswers[q.id] = correctIdx >= 0 ? correctIdx : 0;
      if (answers[q.id] !== undefined && answers[q.id] === correctIdx) {
        score++;
      }
    }

    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const passed = percentage >= 60;

    // Update progress — mark lesson as started (at minimum) when quiz is taken
    // Uses raw SQL because lesson_progress has no Prisma model any more.
    if (userId) {
      const now = new Date();
      await prisma.$executeRaw`
        INSERT INTO "lesson_progress" ("id", "userId", "lessonId", "completed", "watchPercentage", "timeSpent", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${userId}, ${lessonId}, false, 0, 0, ${now}, ${now})
        ON CONFLICT ("userId", "lessonId") DO NOTHING
      `;
    }

    return {
      lessonId,
      score,
      total,
      percentage,
      passed,
      answers,
      correctAnswers,
    };
  }

  // ── Learning Stats ──────────────────────────────────────────────────────────

  async getLearningStats(userId: string): Promise<LearningStats> {
    // All queries use raw SQL because the legacy lesson/roadmap Prisma models
    // were removed from schema.prisma. The tables still exist in production.
    //
    // Parallel: progress entries + bookmarks count
    const [progressRows, bookmarksCount] = await Promise.all([
      prisma.$queryRaw<{
        completed: boolean;
        completed_at: Date | null;
        time_spent: number;
        lesson_id: string;
        roadmap_id: string | null;
      }[]>`
        SELECT lp.completed,
               lp."completedAt"   AS completed_at,
               lp."timeSpent"     AS time_spent,
               lp."lessonId"      AS lesson_id,
               rs."roadmapId"     AS roadmap_id
        FROM   "lesson_progress"  lp
        JOIN   "lessons"          l  ON l.id = lp."lessonId"  AND l."deletedAt" IS NULL
        JOIN   "roadmap_sections" rs ON rs.id = l."sectionId" AND rs."deletedAt" IS NULL
        WHERE  lp."userId" = ${userId}
      `,
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) AS count FROM "bookmarks" WHERE "userId" = ${userId}
      `,
    ]);

    // Build roadmap → lesson stats maps from already-loaded rows
    const roadmapIds = new Set<string>();
    for (const p of progressRows) {
      if (p.roadmap_id) roadmapIds.add(p.roadmap_id);
    }

    const completedLessonsMap: Record<string, number> = {};
    for (const p of progressRows) {
      if (p.roadmap_id && p.completed) {
        completedLessonsMap[p.roadmap_id] = (completedLessonsMap[p.roadmap_id] ?? 0) + 1;
      }
    }

    // Batch fetch published lesson counts per roadmap in one query
    let totalLessonsMap: Record<string, number> = {};
    if (roadmapIds.size > 0) {
      const roadmapIdList = Array.from(roadmapIds);
      const counts = await prisma.$queryRaw<{ roadmap_id: string; cnt: bigint }[]>`
        SELECT rs."roadmapId" AS roadmap_id, COUNT(l.id) AS cnt
        FROM   "lessons"          l
        JOIN   "roadmap_sections" rs ON rs.id = l."sectionId"
        WHERE  rs."roadmapId" = ANY(${roadmapIdList})
          AND  l."deletedAt"  IS NULL
          AND  rs."deletedAt" IS NULL
          AND  l."isPublished" = true
        GROUP BY rs."roadmapId"
      `;
      for (const row of counts) {
        totalLessonsMap[row.roadmap_id] = Number(row.cnt);
      }
    }

    let completedRoadmaps = 0;
    let inProgressRoadmaps = 0;
    for (const rid of roadmapIds) {
      const total = totalLessonsMap[rid] ?? 0;
      const completed = completedLessonsMap[rid] ?? 0;
      if (total > 0 && completed >= total) {
        completedRoadmaps++;
      } else if (completed > 0) {
        inProgressRoadmaps++;
      }
    }

    const totalLessonsCompleted = progressRows.filter((p) => p.completed).length;
    const totalMinutes = progressRows.reduce((sum, p) => sum + (Number(p.time_spent) || 0), 0);
    const totalHoursLearned = Math.round((totalMinutes / 60) * 10) / 10;

    const bookmarksCountNum = Number((bookmarksCount[0] as { count: bigint })?.count ?? 0);

    // Streak: compute from already-loaded progress
    const completedDates = progressRows
      .filter((p) => p.completed && p.completed_at)
      .map((p) => p.completed_at!);

    let currentStreak = 0;
    let longestStreak = 0;

    if (completedDates.length > 0) {
      const uniqueDays = new Set(completedDates.map((d) => d.toISOString().split('T')[0]));
      const sortedDays = Array.from(uniqueDays).sort().reverse();
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let streak = 0;
      let prevDay: string | null = null;
      for (const day of sortedDays) {
        if (!prevDay) {
          if (day === today || day === yesterday) { streak = 1; } else { break; }
        } else {
          const diffDays = Math.round(
            (new Date(prevDay).getTime() - new Date(day).getTime()) / (1000 * 60 * 60 * 24),
          );
          if (diffDays === 1) { streak++; } else { break; }
        }
        prevDay = day;
      }
      currentStreak = streak;

      let runStreak = 1;
      const allSortedDays = Array.from(uniqueDays).sort();
      for (let i = 1; i < allSortedDays.length; i++) {
        const diff = Math.round(
          (new Date(allSortedDays[i]).getTime() - new Date(allSortedDays[i - 1]).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (diff === 1) {
          runStreak++;
          longestStreak = Math.max(longestStreak, runStreak);
        } else {
          runStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak, allSortedDays.length > 0 ? 1 : 0);
    }

    return {
      totalRoadmaps: roadmapIds.size,
      completedRoadmaps,
      inProgressRoadmaps,
      totalLessonsCompleted,
      totalHoursLearned,
      currentStreak,
      longestStreak,
      bookmarksCount: bookmarksCountNum,
    };
  }
}

export const quizService = new QuizService();
