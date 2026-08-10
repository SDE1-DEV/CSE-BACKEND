import {
  Course,
  CourseStatus,
  LearningContent,
  LearningNoteImage,
  LearningProgress,
  LearningProgressStatus,
  Level,
} from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middlewares/error.middleware';
import { HTTP_STATUS } from '../../constants';

type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

interface StudentCourseProgress {
  completedDays: number;
  totalDays: number;
  progressPercentage: number;
}

interface StudentCourseWithProgress extends Course {
  progress: StudentCourseProgress;
}

interface RoadmapContentItem {
  id: string;
  courseId: string;
  levelId: string;
  dayNumber: number;
  topicName: string;
  slug: string;
  description: string | null;
  reelUrl: string | null;
  youtubeUrl: string | null;
  order: number;
  publishedAt: Date | null;
  status: ProgressStatus;
  hasNotes: boolean;
}

interface RoadmapLevelItem extends Level {
  contents: RoadmapContentItem[];
  totalDays: number;
  completedDays: number;
}

export class StudentService {
  async getStudentCourses(userId: string): Promise<StudentCourseWithProgress[]> {
    const courses = await prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      orderBy: [{ createdAt: 'desc' }],
    });

    const courseIds = courses.map((c) => c.id);

    const [totalContentsPerCourse, completedProgressPerCourse] = await Promise.all([
      prisma.learningContent.groupBy({
        by: ['courseId'],
        where: { courseId: { in: courseIds }, published: true },
        _count: { id: true },
      }),
      prisma.learningProgress.groupBy({
        by: ['courseId'],
        where: {
          userId,
          courseId: { in: courseIds },
          status: LearningProgressStatus.COMPLETED,
        },
        _count: { id: true },
      }),
    ]);

    const totalMap = new Map(totalContentsPerCourse.map((r) => [r.courseId, r._count.id]));
    const completedMap = new Map(
      completedProgressPerCourse.map((r) => [r.courseId, r._count.id]),
    );

    return courses.map((course) => {
      const totalDays = totalMap.get(course.id) ?? 0;
      const completedDays = completedMap.get(course.id) ?? 0;
      const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      return {
        ...course,
        progress: {
          completedDays,
          totalDays,
          progressPercentage,
        },
      };
    });
  }

  async getStudentCourse(
    courseId: string,
    userId: string,
  ): Promise<
    Course & {
      levels: (Level & {
        dayCount: number;
      })[];
      progress: StudentCourseProgress;
    }
  > {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        levels: {
          where: { status: CourseStatus.PUBLISHED },
          orderBy: [{ order: 'asc' }, { levelNumber: 'asc' }],
        },
      },
    });

    if (!course || course.status !== CourseStatus.PUBLISHED) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Course not found');
    }

    const levelIds = course.levels.map((l) => l.id);

    const [contentCounts, totalCount, completedCount] = await Promise.all([
      prisma.learningContent.groupBy({
        by: ['levelId'],
        where: { levelId: { in: levelIds }, published: true },
        _count: { id: true },
      }),
      prisma.learningContent.count({
        where: { courseId, published: true },
      }),
      prisma.learningProgress.count({
        where: {
          userId,
          courseId,
          status: LearningProgressStatus.COMPLETED,
        },
      }),
    ]);

    const dayCountMap = new Map(contentCounts.map((r) => [r.levelId, r._count.id]));

    const levelsWithDayCount = course.levels.map((level) => ({
      ...level,
      dayCount: dayCountMap.get(level.id) ?? 0,
    }));

    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      ...course,
      levels: levelsWithDayCount,
      progress: {
        completedDays: completedCount,
        totalDays: totalCount,
        progressPercentage,
      },
    };
  }

  async getStudentRoadmap(
    courseId: string,
    userId: string,
  ): Promise<{
    course: Course;
    levels: RoadmapLevelItem[];
    progress: StudentCourseProgress;
  }> {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.status !== CourseStatus.PUBLISHED) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Course not found');
    }

    const levels = await prisma.level.findMany({
      where: { courseId, status: CourseStatus.PUBLISHED },
      orderBy: [{ order: 'asc' }, { levelNumber: 'asc' }],
      include: {
        contents: {
          where: { published: true },
          orderBy: [{ order: 'asc' }, { dayNumber: 'asc' }],
          include: {
            noteImages: { select: { id: true } },
          },
        },
      },
    });

    const contentIds = levels.flatMap((l) => l.contents.map((c) => c.id));

    const progressRows = await prisma.learningProgress.findMany({
      where: { userId, contentId: { in: contentIds } },
      select: { contentId: true, status: true },
    });

    const progressMap = new Map(
      progressRows.map((p) => [p.contentId, p.status as ProgressStatus]),
    );

    let totalDays = 0;
    let completedDays = 0;

    const roadmapLevels: RoadmapLevelItem[] = levels.map((level) => {
      const levelContents: RoadmapContentItem[] = level.contents.map((content) => {
        const status = progressMap.get(content.id) ?? 'NOT_STARTED';
        const hasNotes = content.noteImages.length > 0;
        const youtubeUrl = content.youtubeUrl ?? level.youtubeUrl;

        if (status === 'COMPLETED') completedDays++;
        totalDays++;

        return {
          id: content.id,
          courseId: content.courseId,
          levelId: content.levelId,
          dayNumber: content.dayNumber,
          topicName: content.topicName,
          slug: content.slug,
          description: content.description,
          reelUrl: content.reelUrl,
          youtubeUrl,
          order: content.order,
          publishedAt: content.publishedAt,
          status,
          hasNotes,
        };
      });

      const levelCompleted = levelContents.filter((c) => c.status === 'COMPLETED').length;

      return {
        ...level,
        contents: levelContents,
        totalDays: levelContents.length,
        completedDays: levelCompleted,
      };
    });

    const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    return {
      course,
      levels: roadmapLevels,
      progress: {
        completedDays,
        totalDays,
        progressPercentage,
      },
    };
  }

  async getCurrentLearning(
    courseId: string,
    userId: string,
  ): Promise<{
    course: Course;
    level: Level;
    content: LearningContent & { noteImages: LearningNoteImage[] };
    progress: StudentCourseProgress;
    nextContent: (LearningContent & { level: { id: string; title: string } }) | null;
  }> {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.status !== CourseStatus.PUBLISHED) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Course not found');
    }

    const inProgress = await prisma.learningProgress.findFirst({
      where: {
        userId,
        courseId,
        status: LearningProgressStatus.IN_PROGRESS,
        content: { published: true },
      },
      orderBy: { lastAccessedAt: 'desc' },
      include: {
        content: {
          include: {
            noteImages: { orderBy: { imageOrder: 'asc' } },
            level: true,
          },
        },
      },
    });

    let targetContent: (LearningContent & {
      noteImages: LearningNoteImage[];
      level: Level;
    }) | null = null;

    if (inProgress) {
      targetContent = inProgress.content as unknown as typeof targetContent;
    } else {
      const startedContentIds = await prisma.learningProgress.findMany({
        where: { userId, courseId },
        select: { contentId: true },
      });
      const startedIds = new Set(startedContentIds.map((p) => p.contentId));

      const firstUnstarted = await prisma.learningContent.findFirst({
        where: {
          courseId,
          published: true,
          id: { notIn: Array.from(startedIds) },
        },
        orderBy: [{ order: 'asc' }, { dayNumber: 'asc' }],
        include: {
          noteImages: { orderBy: { imageOrder: 'asc' } },
          level: true,
        },
      });

      if (firstUnstarted) {
        targetContent = firstUnstarted;
      } else {
        const anyPublished = await prisma.learningContent.findFirst({
          where: { courseId, published: true },
          orderBy: [{ order: 'asc' }, { dayNumber: 'asc' }],
          include: {
            noteImages: { orderBy: { imageOrder: 'asc' } },
            level: true,
          },
        });
        targetContent = anyPublished;
      }
    }

    if (!targetContent) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'No learning content available for this course');
    }

    const [totalCount, completedCount] = await Promise.all([
      prisma.learningContent.count({ where: { courseId, published: true } }),
      prisma.learningProgress.count({
        where: {
          userId,
          courseId,
          status: LearningProgressStatus.COMPLETED,
        },
      }),
    ]);

    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const nextContent = await prisma.learningContent.findFirst({
      where: {
        courseId,
        published: true,
        order: { gte: targetContent.order },
        dayNumber: { gt: targetContent.dayNumber },
        OR: [
          { order: { gt: targetContent.order } },
          { order: targetContent.order, dayNumber: { gt: targetContent.dayNumber } },
        ],
        NOT: { id: targetContent.id },
      },
      orderBy: [{ order: 'asc' }, { dayNumber: 'asc' }],
      include: { level: { select: { id: true, title: true } } },
    });

    return {
      course,
      level: targetContent.level,
      content: targetContent,
      progress: {
        completedDays: completedCount,
        totalDays: totalCount,
        progressPercentage,
      },
      nextContent,
    };
  }

  async getContentForStudent(
    contentId: string,
    userId: string,
  ): Promise<
    LearningContent & {
      noteImages: LearningNoteImage[];
      level: Level;
      course: Course;
    }
  > {
    const content = await prisma.learningContent.findUnique({
      where: { id: contentId },
      include: {
        noteImages: { orderBy: { imageOrder: 'asc' } },
        level: true,
        course: true,
      },
    });

    if (!content || !content.published) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Learning content not found');
    }

    if (content.course.status !== CourseStatus.PUBLISHED) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Learning content not found');
    }

    await prisma.learningProgress.upsert({
      where: { userId_contentId: { userId, contentId } },
      create: {
        userId,
        courseId: content.courseId,
        contentId,
        status: LearningProgressStatus.IN_PROGRESS,
        startedAt: new Date(),
        lastAccessedAt: new Date(),
      },
      update: {
        status: LearningProgressStatus.IN_PROGRESS,
        startedAt: new Date(),
        lastAccessedAt: new Date(),
      },
    });

    return content;
  }

  async updateProgress(
    contentId: string,
    userId: string,
    status: LearningProgressStatus,
  ): Promise<LearningProgress> {
    const content = await prisma.learningContent.findUnique({
      where: { id: contentId },
      select: { id: true, courseId: true, published: true },
    });
    if (!content || !content.published) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Learning content not found');
    }

    const existing = await prisma.learningProgress.findUnique({
      where: { userId_contentId: { userId, contentId } },
      select: { status: true, startedAt: true, completedAt: true },
    });

    const now = new Date();
    let startedAt: Date | null | undefined = existing?.startedAt;
    let completedAt: Date | null | undefined = existing?.completedAt;

    if (status === LearningProgressStatus.IN_PROGRESS && !startedAt) {
      startedAt = now;
    }
    if (status === LearningProgressStatus.COMPLETED && !completedAt) {
      completedAt = now;
    }
    if (status === LearningProgressStatus.NOT_STARTED) {
      startedAt = null;
      completedAt = null;
    }

    return prisma.learningProgress.upsert({
      where: { userId_contentId: { userId, contentId } },
      create: {
        userId,
        courseId: content.courseId,
        contentId,
        status,
        startedAt: status !== LearningProgressStatus.NOT_STARTED ? startedAt ?? now : null,
        completedAt: status === LearningProgressStatus.COMPLETED ? completedAt ?? now : null,
        lastAccessedAt: now,
      },
      update: {
        status,
        startedAt,
        completedAt,
        lastAccessedAt: now,
      },
    });
  }

  async getProgress(
    userId: string,
    courseId?: string,
  ): Promise<
    | {
        courseId: string;
        completedDays: number;
        totalDays: number;
        progressPercentage: number;
        contents: {
          contentId: string;
          status: LearningProgressStatus;
          startedAt: Date | null;
          completedAt: Date | null;
        }[];
      }
    | {
        courses: {
          courseId: string;
          courseTitle: string;
          completedDays: number;
          totalDays: number;
          progressPercentage: number;
        }[];
      }
  > {
    if (courseId) {
      const [totalDays, progressRows] = await Promise.all([
        prisma.learningContent.count({
          where: { courseId, published: true },
        }),
        prisma.learningProgress.findMany({
          where: { userId, courseId },
          select: {
            contentId: true,
            status: true,
            startedAt: true,
            completedAt: true,
          },
        }),
      ]);

      const completedDays = progressRows.filter(
        (p) => p.status === LearningProgressStatus.COMPLETED,
      ).length;

      const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      return {
        courseId,
        completedDays,
        totalDays,
        progressPercentage,
        contents: progressRows,
      };
    }

    const courses = await prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      select: { id: true, title: true },
    });
    const courseIds = courses.map((c) => c.id);

    const [totalPerCourse, completedPerCourse] = await Promise.all([
      prisma.learningContent.groupBy({
        by: ['courseId'],
        where: { courseId: { in: courseIds }, published: true },
        _count: { id: true },
      }),
      prisma.learningProgress.groupBy({
        by: ['courseId'],
        where: {
          userId,
          courseId: { in: courseIds },
          status: LearningProgressStatus.COMPLETED,
        },
        _count: { id: true },
      }),
    ]);

    const totalMap = new Map(totalPerCourse.map((r) => [r.courseId, r._count.id]));
    const completedMap = new Map(completedPerCourse.map((r) => [r.courseId, r._count.id]));
    const titleMap = new Map(courses.map((c) => [c.id, c.title]));

    return {
      courses: courseIds.map((cid) => {
        const totalDays = totalMap.get(cid) ?? 0;
        const completedDays = completedMap.get(cid) ?? 0;
        const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

        return {
          courseId: cid,
          courseTitle: titleMap.get(cid) ?? '',
          completedDays,
          totalDays,
          progressPercentage,
        };
      }),
    };
  }

  async getStudentDashboard(userId: string): Promise<{
    activeCourse: (Course & { progress: StudentCourseProgress }) | null;
    currentLevel: Level | null;
    currentDay: number | null;
    currentTopic: string | null;
    overallProgress: number;
    levelProgress: number;
    completedDays: number;
    totalDays: number;
    continueLearningContent: (LearningContent & {
      level: { id: string; title: string; levelNumber: number };
      course: { id: string; title: string; slug: string };
    }) | null;
    nextContent: (LearningContent & {
      level: { id: string; title: string };
    }) | null;
    roadmapSummary: {
      levelId: string;
      levelTitle: string;
      levelNumber: number;
      total: number;
      completed: number;
    }[];
  }> {
    const recentProgress = await prisma.learningProgress.findFirst({
      where: {
        userId,
        content: { published: true, course: { status: CourseStatus.PUBLISHED } },
      },
      orderBy: { lastAccessedAt: 'desc' },
      include: {
        content: {
          include: {
            level: true,
            course: true,
          },
        },
      },
    });

    let activeCourse: (Course & { progress: StudentCourseProgress }) | null = null;
    let currentLevel: Level | null = null;
    let currentDay: number | null = null;
    let currentTopic: string | null = null;
    let continueLearningContent: (LearningContent & {
      level: { id: string; title: string; levelNumber: number };
      course: { id: string; title: string; slug: string };
    }) | null = null;
    let nextContent: (LearningContent & {
      level: { id: string; title: string };
    }) | null = null;
    let roadmapSummary: {
      levelId: string;
      levelTitle: string;
      levelNumber: number;
      total: number;
      completed: number;
    }[] = [];
    let overallProgress = 0;
    let levelProgress = 0;
    let completedDays = 0;
    let totalDays = 0;

    if (recentProgress) {
      const course = recentProgress.content.course;
      if (course.status === CourseStatus.PUBLISHED) {
        const courseId = course.id;

        [totalDays, completedDays] = await Promise.all([
          prisma.learningContent.count({ where: { courseId, published: true } }),
          prisma.learningProgress.count({
            where: {
              userId,
              courseId,
              status: LearningProgressStatus.COMPLETED,
            },
          }),
        ]);

        overallProgress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

        activeCourse = {
          ...course,
          progress: {
            completedDays,
            totalDays,
            progressPercentage: overallProgress,
          },
        };

        currentLevel = recentProgress.content.level;
        currentDay = recentProgress.content.dayNumber;
        currentTopic = recentProgress.content.topicName;

        const levelId = currentLevel.id;
        const [levelTotal, levelCompleted] = await Promise.all([
          prisma.learningContent.count({
            where: { levelId, published: true },
          }),
          prisma.learningProgress.count({
            where: {
              userId,
              content: { levelId },
              status: LearningProgressStatus.COMPLETED,
            },
          }),
        ]);
        levelProgress = levelTotal > 0 ? Math.round((levelCompleted / levelTotal) * 100) : 0;

        continueLearningContent = {
          ...recentProgress.content,
          level: {
            id: currentLevel.id,
            title: currentLevel.title,
            levelNumber: currentLevel.levelNumber,
          },
          course: {
            id: course.id,
            title: course.title,
            slug: course.slug,
          },
        };

        nextContent = await prisma.learningContent.findFirst({
          where: {
            courseId,
            published: true,
            OR: [
              { order: { gt: recentProgress.content.order } },
              {
                order: recentProgress.content.order,
                dayNumber: { gt: recentProgress.content.dayNumber },
              },
            ],
            NOT: { id: recentProgress.contentId },
          },
          orderBy: [{ order: 'asc' }, { dayNumber: 'asc' }],
          include: { level: { select: { id: true, title: true } } },
        });

        const levels = await prisma.level.findMany({
          where: { courseId, status: CourseStatus.PUBLISHED },
          orderBy: [{ order: 'asc' }, { levelNumber: 'asc' }],
          select: { id: true, title: true, levelNumber: true },
        });
        const levelIds = levels.map((l) => l.id);

        const [totals, completeds] = await Promise.all([
          prisma.learningContent.groupBy({
            by: ['levelId'],
            where: { levelId: { in: levelIds }, published: true },
            _count: { id: true },
          }),
          prisma.learningProgress.groupBy({
            by: ['contentId'],
            where: {
              userId,
              content: { levelId: { in: levelIds } },
              status: LearningProgressStatus.COMPLETED,
            },
            _count: { id: true },
          }),
        ]);

        const totalLMap = new Map(totals.map((t) => [t.levelId, t._count.id]));

        const completedLevelContentIds = completeds.map((c) => c.contentId);
        const completedByLevel = new Map<string, number>();
        if (completedLevelContentIds.length > 0) {
          const contentsWithLevel = await prisma.learningContent.findMany({
            where: { id: { in: completedLevelContentIds } },
            select: { id: true, levelId: true },
          });
          for (const c of contentsWithLevel) {
            completedByLevel.set(c.levelId, (completedByLevel.get(c.levelId) ?? 0) + 1);
          }
        }

        roadmapSummary = levels.map((l) => ({
          levelId: l.id,
          levelTitle: l.title,
          levelNumber: l.levelNumber,
          total: totalLMap.get(l.id) ?? 0,
          completed: completedByLevel.get(l.id) ?? 0,
        }));
      }
    }

    if (!activeCourse) {
      const firstPublishedCourse = await prisma.course.findFirst({
        where: { status: CourseStatus.PUBLISHED },
        orderBy: { createdAt: 'desc' },
      });
      if (firstPublishedCourse) {
        activeCourse = {
          ...firstPublishedCourse,
          progress: { completedDays: 0, totalDays: 0, progressPercentage: 0 },
        };
      }
    }

    return {
      activeCourse,
      currentLevel,
      currentDay,
      currentTopic,
      overallProgress,
      levelProgress,
      completedDays,
      totalDays,
      continueLearningContent,
      nextContent,
      roadmapSummary,
    };
  }
}

export const studentService = new StudentService();
