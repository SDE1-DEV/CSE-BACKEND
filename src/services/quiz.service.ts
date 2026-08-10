/**
 * Quiz & Practice Question Service
 *
 * The following tables exist physically in production (via raw SQL migrations)
 * but are NOT in schema.prisma so Prisma Client has no typed models:
 *   - lesson_practice_questions
 *   - quiz_questions
 *   - quiz_options
 *   - lessons
 *   - lesson_progress
 *   - roadmap_sections
 *
 * ALL access to those tables uses prisma.$queryRaw / prisma.$executeRaw.
 */

import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, LEARNING_MESSAGES } from '../constants';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PracticeQuestionDTO {
  id: string;
  lessonId: string;
  question: string;
  answer: string;
  hint: string | null;
  difficulty: string;
  order: number;
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
    // Verify lesson exists via raw SQL
    const lessonRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "lessons" WHERE id = ${lessonId} AND "deletedAt" IS NULL LIMIT 1
    `;
    if (lessonRows.length === 0) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    const rows = await prisma.$queryRaw<{
      id: string;
      lessonId: string;
      question: string;
      answer: string;
      hint: string | null;
      difficulty: string;
      displayOrder: number;
    }[]>`
      SELECT id, "lessonId", question, answer, hint, difficulty, "displayOrder"
      FROM "lesson_practice_questions"
      WHERE "lessonId" = ${lessonId}
      ORDER BY "displayOrder" ASC
    `;

    return rows.map((r) => ({
      id: r.id,
      lessonId: r.lessonId,
      question: r.question,
      answer: r.answer,
      hint: r.hint,
      difficulty: r.difficulty.toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
      order: r.displayOrder,
      type: 'theory' as const,
    }));
  }

  // ── Quiz Questions ──────────────────────────────────────────────────────────

  async getQuizQuestions(lessonId: string): Promise<QuizQuestionDTO[]> {
    // Verify lesson exists via raw SQL
    const lessonRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "lessons" WHERE id = ${lessonId} AND "deletedAt" IS NULL LIMIT 1
    `;
    if (lessonRows.length === 0) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    const questions = await prisma.$queryRaw<{
      id: string;
      lessonId: string;
      question: string;
      explanation: string | null;
      displayOrder: number;
    }[]>`
      SELECT id, "lessonId", question, explanation, "displayOrder"
      FROM "quiz_questions"
      WHERE "lessonId" = ${lessonId}
      ORDER BY "displayOrder" ASC
    `;

    if (questions.length === 0) return [];

    const questionIds = questions.map((q) => q.id);
    const options = await prisma.$queryRaw<{
      id: string;
      quizQuestionId: string;
      text: string;
      isCorrect: boolean;
      displayOrder: number;
    }[]>`
      SELECT id, "quizQuestionId", text, "isCorrect", "displayOrder"
      FROM "quiz_options"
      WHERE "quizQuestionId" = ANY(${questionIds})
      ORDER BY "displayOrder" ASC
    `;

    const optionsByQuestion: Record<string, typeof options> = {};
    for (const o of options) {
      if (!optionsByQuestion[o.quizQuestionId]) optionsByQuestion[o.quizQuestionId] = [];
      optionsByQuestion[o.quizQuestionId].push(o);
    }

    return questions.map((q) => {
      const qOpts = optionsByQuestion[q.id] ?? [];
      const correctIdx = qOpts.findIndex((o) => o.isCorrect);
      return {
        id: q.id,
        lessonId: q.lessonId,
        question: q.question,
        options: qOpts.map((o) => o.text),
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
    // Verify lesson exists
    const lessonRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "lessons" WHERE id = ${lessonId} AND "deletedAt" IS NULL LIMIT 1
    `;
    if (lessonRows.length === 0) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, LEARNING_MESSAGES.LESSON_NOT_FOUND);
    }

    const questions = await prisma.$queryRaw<{
      id: string;
      displayOrder: number;
    }[]>`
      SELECT id, "displayOrder"
      FROM "quiz_questions"
      WHERE "lessonId" = ${lessonId}
      ORDER BY "displayOrder" ASC
    `;

    const questionIds = questions.map((q) => q.id);
    const options = questionIds.length > 0
      ? await prisma.$queryRaw<{
          quizQuestionId: string;
          isCorrect: boolean;
          displayOrder: number;
        }[]>`
          SELECT "quizQuestionId", "isCorrect", "displayOrder"
          FROM "quiz_options"
          WHERE "quizQuestionId" = ANY(${questionIds})
          ORDER BY "displayOrder" ASC
        `
      : [];

    const optionsByQuestion: Record<string, { isCorrect: boolean; displayOrder: number }[]> = {};
    for (const o of options) {
      if (!optionsByQuestion[o.quizQuestionId]) optionsByQuestion[o.quizQuestionId] = [];
      optionsByQuestion[o.quizQuestionId].push(o);
    }

    let score = 0;
    const correctAnswers: Record<string, number> = {};
    for (const q of questions) {
      const qOpts = optionsByQuestion[q.id] ?? [];
      const correctIdx = qOpts.findIndex((o) => o.isCorrect);
      correctAnswers[q.id] = correctIdx >= 0 ? correctIdx : 0;
      if (answers[q.id] !== undefined && answers[q.id] === correctIdx) score++;
    }

    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const passed = percentage >= 60;

    // Record lesson_progress entry via raw SQL
    if (userId) {
      const now = new Date();
      await prisma.$executeRaw`
        INSERT INTO "lesson_progress"
          ("id", "userId", "lessonId", "completed", "watchPercentage", "timeSpent", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${userId}, ${lessonId}, false, 0, 0, ${now}, ${now})
        ON CONFLICT ("userId", "lessonId") DO NOTHING
      `;
    }

    return { lessonId, score, total, percentage, passed, answers, correctAnswers };
  }

  // ── Learning Stats ──────────────────────────────────────────────────────────
  //
  // Uses the LEGACY lesson_progress table (physically exists, no Prisma model).
  // Returns valid zero-statistics when the user has no progress at all.

  async getLearningStats(userId: string): Promise<LearningStats> {
    // Single JOIN query — all legacy tables still exist in production
    const [progressRows, bookmarksCountRows] = await Promise.all([
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
        JOIN   "lessons"          l  ON l.id  = lp."lessonId"  AND l."deletedAt"  IS NULL
        JOIN   "roadmap_sections" rs ON rs.id = l."sectionId"  AND rs."deletedAt" IS NULL
        WHERE  lp."userId" = ${userId}
      `.catch(() => [] as { completed: boolean; completed_at: Date | null; time_spent: number; lesson_id: string; roadmap_id: string | null }[]),

      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) AS count FROM "bookmarks" WHERE "userId" = ${userId}
      `.catch(() => [{ count: BigInt(0) }] as { count: bigint }[]),
    ]);

    // If the lesson_progress table query failed (e.g. table doesn't exist for some reason),
    // we already caught it and returned []. Return zero-state stats.

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

    // Batch fetch published lesson counts per roadmap
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
      `.catch(() => [] as { roadmap_id: string; cnt: bigint }[]);

      for (const row of counts) {
        totalLessonsMap[row.roadmap_id] = Number(row.cnt);
      }
    }

    let completedRoadmaps = 0;
    let inProgressRoadmaps = 0;
    for (const rid of roadmapIds) {
      const total = totalLessonsMap[rid] ?? 0;
      const completed = completedLessonsMap[rid] ?? 0;
      if (total > 0 && completed >= total) completedRoadmaps++;
      else if (completed > 0) inProgressRoadmaps++;
    }

    const totalLessonsCompleted = progressRows.filter((p) => p.completed).length;
    const totalMinutes = progressRows.reduce((sum, p) => sum + (Number(p.time_spent) || 0), 0);
    const totalHoursLearned = Math.round((totalMinutes / 60) * 10) / 10;
    const bookmarksCountNum = Number((bookmarksCountRows[0] as { count: bigint })?.count ?? 0);

    // Streak computation from loaded rows
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
          if (day === today || day === yesterday) streak = 1;
          else break;
        } else {
          const diffDays = Math.round(
            (new Date(prevDay).getTime() - new Date(day).getTime()) / (1000 * 60 * 60 * 24),
          );
          if (diffDays === 1) streak++;
          else break;
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
