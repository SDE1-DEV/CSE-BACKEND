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
    Omit<LearningContent, 'noteImages'> & {
      notes: {
        id: string;
        contentId: string;
        imageUrl: string;
        storagePath: string;
        displayOrder: number;
        createdAt: Date;
      }[];
      levelNumber: number;
      level: Level;
      course: Course;
      progressStatus: string | null;
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

    const progress = await prisma.learningProgress.upsert({
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
        lastAccessedAt: new Date(),
      },
      select: { status: true },
    });

    // Remap noteImages → notes with frontend-expected field names
    const notes = content.noteImages.map((ni) => ({
      id: ni.id,
      contentId: ni.learningContentId,
      imageUrl: ni.imageUrl,
      storagePath: ni.storagePath,
      displayOrder: ni.imageOrder,
      createdAt: ni.createdAt,
    }));

    const { noteImages: _ni, ...contentWithoutNoteImages } = content;
    void _ni;

    return {
      ...contentWithoutNoteImages,
      levelNumber: content.level.levelNumber,
      notes,
      level: content.level,
      course: content.course,
      progressStatus: progress.status,
    };
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

  // ── Flat Roadmap (StudentRoadmap shape) ─────────────────────────────────────
  // Called by GET /learning/roadmap
  // Returns the shape the frontend StudentRoadmap type expects:
  // { levels: RoadmapLevel[], currentDayId, totalCompleted, totalAvailable }

  async getStudentRoadmapFlat(userId: string): Promise<{
    levels: {
      id: string;
      levelNumber: number;
      title: string;
      description: string | null;
      isActive: boolean;
      totalDays: number;
      completedDays: number;
      days: {
        id: string;
        dayNumber: number;
        topicName: string;
        status: string;
        progressStatus: string | null;
        state: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'LOCKED';
        progress: null;
      }[];
    }[];
    currentDayId: string | null;
    totalCompleted: number;
    totalAvailable: number;
  }> {
    // Get the first published course (single-course platform)
    const course = await prisma.course.findFirst({
      where: { status: CourseStatus.PUBLISHED },
      orderBy: { createdAt: 'desc' },
    });

    if (!course) {
      return { levels: [], currentDayId: null, totalCompleted: 0, totalAvailable: 0 };
    }

    const levels = await prisma.level.findMany({
      where: { courseId: course.id, status: CourseStatus.PUBLISHED },
      orderBy: [{ order: 'asc' }, { levelNumber: 'asc' }],
    });

    if (levels.length === 0) {
      return { levels: [], currentDayId: null, totalCompleted: 0, totalAvailable: 0 };
    }

    const levelIds = levels.map((l) => l.id);

    const [allContents, progressRows] = await Promise.all([
      prisma.learningContent.findMany({
        where: { levelId: { in: levelIds }, published: true },
        orderBy: [{ order: 'asc' }, { dayNumber: 'asc' }],
        select: { id: true, levelId: true, dayNumber: true, topicName: true, order: true },
      }),
      prisma.learningProgress.findMany({
        where: { userId, courseId: course.id },
        select: { contentId: true, status: true },
      }),
    ]);

    const progressMap = new Map(progressRows.map((p) => [p.contentId, p.status as string]));

    const totalAvailable = allContents.length;
    let totalCompleted = 0;
    let currentDayId: string | null = null;

    // Determine "current" = most recent IN_PROGRESS, or first NOT_STARTED
    const inProgressId = progressRows
      .filter((p) => p.status === LearningProgressStatus.IN_PROGRESS)
      .map((p) => p.contentId)[0] ?? null;

    const completedIds = new Set(
      progressRows.filter((p) => p.status === LearningProgressStatus.COMPLETED).map((p) => p.contentId),
    );
    totalCompleted = completedIds.size;

    // current = in-progress, or first not-started
    if (inProgressId) {
      currentDayId = inProgressId;
    } else {
      const firstNotStarted = allContents.find((c) => !progressMap.has(c.id) || progressMap.get(c.id) === 'NOT_STARTED');
      currentDayId = firstNotStarted?.id ?? null;
    }

    // Group contents by level
    const contentsByLevel = new Map<string, typeof allContents>();
    for (const c of allContents) {
      if (!contentsByLevel.has(c.levelId)) contentsByLevel.set(c.levelId, []);
      contentsByLevel.get(c.levelId)!.push(c);
    }

    const roadmapLevels = levels.map((level) => {
      const levelContents = contentsByLevel.get(level.id) ?? [];
      let levelCompleted = 0;

      const days = levelContents.map((content) => {
        const progressStatus = progressMap.get(content.id) ?? 'NOT_STARTED';
        const isCompleted = completedIds.has(content.id);
        const isCurrent = content.id === currentDayId;

        if (isCompleted) levelCompleted++;

        let state: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'LOCKED';
        if (isCompleted) state = 'COMPLETED';
        else if (isCurrent) state = 'CURRENT';
        else if (progressStatus === 'NOT_STARTED') state = 'UPCOMING';
        else state = 'UPCOMING';

        return {
          id: content.id,
          dayNumber: content.dayNumber,
          topicName: content.topicName,
          status: 'PUBLISHED' as string,
          progressStatus: progressStatus === 'NOT_STARTED' ? null : progressStatus,
          state,
          progress: null,
        };
      });

      return {
        id: level.id,
        levelNumber: level.levelNumber,
        title: level.title,
        description: level.description,
        isActive: level.status === CourseStatus.PUBLISHED,
        totalDays: levelContents.length,
        completedDays: levelCompleted,
        days,
      };
    });

    return { levels: roadmapLevels, currentDayId, totalCompleted, totalAvailable };
  }

  // ── StudentLearningDashboard shape ────────────────────────────────────────
  // Called by GET /learning/dashboard — returns the StudentLearningDashboard type

  async getStudentDashboardNew(userId: string): Promise<{
    platformCurrentDay: { levelNumber: number; dayNumber: number; topicName: string } | null;
    studentCurrentDay: { levelNumber: number; dayNumber: number; topicName: string } | null;
    currentLevel: { id: string; levelNumber: number; title: string; description: string | null } | null;
    currentContent: {
      id: string; levelId: string; levelNumber: number; dayNumber: number; topicName: string;
      description: string | null; reelUrl: string | null; youtubeUrl: string | null;
      status: string; publishedAt: Date | null; progressStatus: string | null;
      notes: { id: string; contentId: string; imageUrl: string; storagePath: string; displayOrder: number; createdAt: Date }[];
    } | null;
    progress: { completed: number; total: number; percentage: number };
    levelProgress: { levelNumber: number; title: string; completedDays: number; totalDays: number; percentage: number }[];
  }> {
    // Get active course
    const course = await prisma.course.findFirst({
      where: { status: CourseStatus.PUBLISHED },
      orderBy: { createdAt: 'desc' },
    });

    if (!course) {
      return {
        platformCurrentDay: null,
        studentCurrentDay: null,
        currentLevel: null,
        currentContent: null,
        progress: { completed: 0, total: 0, percentage: 0 },
        levelProgress: [],
      };
    }

    const courseId = course.id;

    // Platform's latest published day
    const latestPublished = await prisma.learningContent.findFirst({
      where: { courseId, published: true },
      orderBy: [{ order: 'desc' }, { dayNumber: 'desc' }],
      include: { level: { select: { levelNumber: true } } },
    });

    const platformCurrentDay = latestPublished
      ? { levelNumber: latestPublished.level.levelNumber, dayNumber: latestPublished.dayNumber, topicName: latestPublished.topicName }
      : null;

    // Student's current progress
    const recentProgress = await prisma.learningProgress.findFirst({
      where: { userId, courseId, content: { published: true } },
      orderBy: { lastAccessedAt: 'desc' },
      include: {
        content: {
          include: {
            level: true,
            noteImages: { orderBy: { imageOrder: 'asc' } },
          },
        },
      },
    });

    const [totalContent, completedContent] = await Promise.all([
      prisma.learningContent.count({ where: { courseId, published: true } }),
      prisma.learningProgress.count({
        where: { userId, courseId, status: LearningProgressStatus.COMPLETED },
      }),
    ]);

    const percentage = totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;

    let studentCurrentDay: { levelNumber: number; dayNumber: number; topicName: string } | null = null;
    let currentLevel: { id: string; levelNumber: number; title: string; description: string | null } | null = null;
    let currentContent: {
      id: string; levelId: string; levelNumber: number; dayNumber: number; topicName: string;
      description: string | null; reelUrl: string | null; youtubeUrl: string | null;
      status: string; publishedAt: Date | null; progressStatus: string | null;
      notes: { id: string; contentId: string; imageUrl: string; storagePath: string; displayOrder: number; createdAt: Date }[];
    } | null = null;

    if (recentProgress) {
      const lvl = recentProgress.content.level;
      studentCurrentDay = { levelNumber: lvl.levelNumber, dayNumber: recentProgress.content.dayNumber, topicName: recentProgress.content.topicName };
      currentLevel = { id: lvl.id, levelNumber: lvl.levelNumber, title: lvl.title, description: lvl.description };
      currentContent = {
        id: recentProgress.content.id,
        levelId: recentProgress.content.levelId,
        levelNumber: lvl.levelNumber,
        dayNumber: recentProgress.content.dayNumber,
        topicName: recentProgress.content.topicName,
        description: recentProgress.content.description,
        reelUrl: recentProgress.content.reelUrl,
        youtubeUrl: recentProgress.content.youtubeUrl ?? lvl.youtubeUrl,
        status: recentProgress.content.published ? 'PUBLISHED' : 'DRAFT',
        publishedAt: recentProgress.content.publishedAt,
        progressStatus: recentProgress.status,
        notes: (recentProgress.content.noteImages ?? []).map((ni) => ({
          id: ni.id,
          contentId: ni.learningContentId,
          imageUrl: ni.imageUrl,
          storagePath: ni.storagePath,
          displayOrder: ni.imageOrder,
          createdAt: ni.createdAt,
        })),
      };
    }

    // Level progress breakdown
    const levels = await prisma.level.findMany({
      where: { courseId, status: CourseStatus.PUBLISHED },
      orderBy: [{ order: 'asc' }, { levelNumber: 'asc' }],
      select: { id: true, levelNumber: true, title: true },
    });

    const levelIds = levels.map((l) => l.id);
    const [levelTotals, levelCompletedRows] = await Promise.all([
      prisma.learningContent.groupBy({
        by: ['levelId'],
        where: { levelId: { in: levelIds }, published: true },
        _count: { id: true },
      }),
      prisma.learningProgress.groupBy({
        by: ['courseId'],
        where: {
          userId,
          courseId,
          status: LearningProgressStatus.COMPLETED,
          content: { levelId: { in: levelIds } },
        },
        _count: { id: true },
      }),
    ]);

    // Per-level completed count requires joining through content
    const completedByLevel = new Map<string, number>();
    if (levelIds.length > 0) {
      const completedContentIds = await prisma.learningProgress.findMany({
        where: { userId, courseId, status: LearningProgressStatus.COMPLETED },
        select: { contentId: true },
      });
      const ids = completedContentIds.map((p) => p.contentId);
      if (ids.length > 0) {
        const contents = await prisma.learningContent.findMany({
          where: { id: { in: ids }, levelId: { in: levelIds } },
          select: { levelId: true },
        });
        for (const c of contents) {
          completedByLevel.set(c.levelId, (completedByLevel.get(c.levelId) ?? 0) + 1);
        }
      }
    }

    const totalMap = new Map(levelTotals.map((t) => [t.levelId, t._count.id]));
    const levelProgress = levels.map((l) => {
      const total = totalMap.get(l.id) ?? 0;
      const completed = completedByLevel.get(l.id) ?? 0;
      return {
        levelNumber: l.levelNumber,
        title: l.title,
        completedDays: completed,
        totalDays: total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    void levelCompletedRows; // used indirectly above

    return {
      platformCurrentDay,
      studentCurrentDay,
      currentLevel,
      currentContent,
      progress: { completed: completedContent, total: totalContent, percentage },
      levelProgress,
    };
  }

  // ── Continue Learning (ContinueLearningResult shape) ─────────────────────
  // Called by GET /learning/continue

  async getStudentContinueLearning(userId: string): Promise<{
    contentId: string;
    levelNumber: number;
    dayNumber: number;
    topicName: string;
    description: string | null;
    progressStatus: string;
    percentageThroughDay: number;
  } | null> {
    const course = await prisma.course.findFirst({
      where: { status: CourseStatus.PUBLISHED },
      orderBy: { createdAt: 'desc' },
    });

    if (!course) return null;

    // Find most recently accessed content
    const recent = await prisma.learningProgress.findFirst({
      where: {
        userId,
        courseId: course.id,
        content: { published: true },
        status: { in: [LearningProgressStatus.IN_PROGRESS, LearningProgressStatus.NOT_STARTED] },
      },
      orderBy: { lastAccessedAt: 'desc' },
      include: {
        content: {
          include: { level: { select: { levelNumber: true } } },
        },
      },
    });

    if (!recent) {
      // No progress yet — return the very first published content
      const firstContent = await prisma.learningContent.findFirst({
        where: { courseId: course.id, published: true },
        orderBy: [{ order: 'asc' }, { dayNumber: 'asc' }],
        include: { level: { select: { levelNumber: true } } },
      });

      if (!firstContent) return null;

      return {
        contentId: firstContent.id,
        levelNumber: firstContent.level.levelNumber,
        dayNumber: firstContent.dayNumber,
        topicName: firstContent.topicName,
        description: firstContent.description,
        progressStatus: 'NOT_STARTED',
        percentageThroughDay: 0,
      };
    }

    return {
      contentId: recent.contentId,
      levelNumber: recent.content.level.levelNumber,
      dayNumber: recent.content.dayNumber,
      topicName: recent.content.topicName,
      description: recent.content.description,
      progressStatus: recent.status,
      percentageThroughDay:
        recent.status === LearningProgressStatus.COMPLETED ? 100 :
        recent.status === LearningProgressStatus.IN_PROGRESS ? 50 : 0,
    };
  }
}

export const studentService = new StudentService();
