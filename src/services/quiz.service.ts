/**
 * Quiz & Practice Question Service
 * Serves lesson practice questions, quiz questions, quiz submission scoring,
 * and per-user learning statistics for the Python learning platform.
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
    if (userId) {
      const existing = await prisma.userProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });
      if (!existing) {
        await prisma.userProgress.create({
          data: { userId, lessonId, completed: false, lastOpened: new Date() },
        });
      }
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
    // Single query: get all progress entries with roadmap info — avoids N+1
    const progressEntries = await prisma.userProgress.findMany({
      where: { userId },
      select: {
        completed: true,
        completedAt: true,
        timeSpent: true,
        lessonId: true,
        lesson: {
          select: { section: { select: { roadmapId: true } } },
        },
      },
    });

    const roadmapIds = new Set<string>();
    for (const p of progressEntries) {
      const rid = p.lesson?.section?.roadmapId;
      if (rid) roadmapIds.add(rid);
    }

    const roadmapIdList = Array.from(roadmapIds);

    // Batch fetch: all published lessons for all roadmaps in one query
    const totalLessonRows = roadmapIdList.length > 0
      ? await prisma.lesson.findMany({
          where: {
            section: { roadmapId: { in: roadmapIdList }, deletedAt: null },
            deletedAt: null,
            isPublished: true,
          },
          select: { id: true, section: { select: { roadmapId: true } } },
        })
      : [];

    // Build map: roadmapId → total lesson count
    const totalLessonsMap: Record<string, number> = {};
    for (const l of totalLessonRows) {
      const rid = l.section?.roadmapId;
      if (rid) totalLessonsMap[rid] = (totalLessonsMap[rid] ?? 0) + 1;
    }

    // Build map: roadmapId → completed lesson count (from already-loaded progress)
    const completedLessonsMap: Record<string, number> = {};
    for (const p of progressEntries) {
      const rid = p.lesson?.section?.roadmapId;
      if (rid && p.completed) {
        completedLessonsMap[rid] = (completedLessonsMap[rid] ?? 0) + 1;
      }
    }

    // Count completed / in-progress roadmaps without extra DB calls
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

    const totalLessonsCompleted = progressEntries.filter((p) => p.completed).length;
    const totalMinutes = progressEntries.reduce((sum, p) => sum + (p.timeSpent ?? 0), 0);
    const totalHoursLearned = Math.round((totalMinutes / 60) * 10) / 10;

    const bookmarksCount = await prisma.bookmark.count({ where: { userId } });

    // Streak: compute from already-loaded progress — no extra DB call
    const completedDates = progressEntries
      .filter((p) => p.completed && p.completedAt)
      .map((p) => p.completedAt!);

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
          (new Date(allSortedDays[i]).getTime() - new Date(allSortedDays[i - 1]).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diff === 1) { runStreak++; longestStreak = Math.max(longestStreak, runStreak); }
        else { runStreak = 1; }
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
      bookmarksCount,
    };
  }
}

export const quizService = new QuizService();
