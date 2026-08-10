import { prisma } from '../config/database';
import { analyticsRepository } from '../repositories/analytics.repository';

export class AnalyticsService {
  async getDashboard(userId: string) {
    const [
      analytics,
      // NEW: Use LearningProgress (current CMS model) instead of old userProgress
      completedLearningCount,
      codingStats,
      activeProjects,
      jobApplications,
      resumes,
      eventRegistrations,
    ] = await Promise.all([
      analyticsRepository.findByUserId(userId),

      // Learning progress — new CMS model
      prisma.learningProgress.count({
        where: { userId, status: 'COMPLETED' },
      }),

      // Coding statistics
      prisma.submission.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true },
      }),

      // Active projects (teams user is member of)
      prisma.teamMember.count({
        where: {
          userId,
          team: { status: { in: ['OPEN', 'FULL'] } },
        },
      }),

      // Placement: application counts by status
      prisma.jobApplication.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true },
      }),

      // Resume completion
      prisma.resume.findMany({
        where: { userId },
        include: { _count: { select: { sections: true } } },
      }),

      // Event registrations
      prisma.eventRegistration.count({ where: { userId } }),
    ]);

    // Coding stats breakdown
    const totalSubmissions = (codingStats as Array<{ status: string; _count: { id: number } }>)
      .reduce((acc, g) => acc + g._count.id, 0);
    const acceptedSubmissions = (codingStats as Array<{ status: string; _count: { id: number } }>)
      .find((g) => g.status === 'ACCEPTED')?._count.id ?? 0;

    // Unique solved problems
    const solvedCount = await prisma.submission.findMany({
      where: { userId, status: 'ACCEPTED' },
      distinct: ['problemId'],
      select: { problemId: true },
    });

    // Application breakdown
    const applicationsByStatus: Record<string, number> = {};
    (jobApplications as Array<{ status: string; _count: { id: number } }>).forEach((g) => {
      applicationsByStatus[g.status] = g._count.id;
    });
    const totalApplications = (jobApplications as Array<{ status: string; _count: { id: number } }>)
      .reduce((acc, g) => acc + g._count.id, 0);

    // Resume completion score (average based on sections count)
    const avgSections =
      resumes.length > 0
        ? (resumes as Array<{ _count: { sections: number } }>).reduce((acc, r) => acc + r._count.sections, 0) / resumes.length
        : 0;
    const resumeCompletion = Math.min(Math.round((avgSections / 6) * 100), 100); // 6 standard sections

    return {
      learning: {
        completedLessons: completedLearningCount,
        currentStreak: analytics?.currentLearningStreak ?? 0,
        longestStreak: analytics?.longestLearningStreak ?? 0,
        totalStudyMinutes: analytics?.totalStudyMinutes ?? 0,
      },
      coding: {
        problemsSolved: solvedCount.length,
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate:
          totalSubmissions > 0
            ? Math.round((acceptedSubmissions / totalSubmissions) * 10000) / 100
            : 0,
      },
      projects: {
        activeTeams: activeProjects,
      },
      placement: {
        totalApplications,
        applicationsByStatus,
      },
      resume: {
        totalResumes: resumes.length,
        completionScore: resumeCompletion,
      },
      events: {
        registeredEvents: eventRegistrations,
      },
      streaks: {
        current: analytics?.currentLearningStreak ?? 0,
        longest: analytics?.longestLearningStreak ?? 0,
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
