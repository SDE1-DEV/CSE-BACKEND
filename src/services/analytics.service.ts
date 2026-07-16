import { prisma } from '../config/database';
import { analyticsRepository } from '../repositories/analytics.repository';

export class AnalyticsService {
  async getDashboard(userId: string) {
    const [
      analytics,
      learningProgress,
      codingStats,
      activeProjects,
      jobApplications,
      resumes,
      eventRegistrations,
    ] = await Promise.all([
      analyticsRepository.findByUserId(userId),

      // Learning progress
      prisma.lessonProgress.aggregate({
        where: { userId, completed: true },
        _count: { id: true },
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
    const totalSubmissions = codingStats.reduce((acc, g) => acc + g._count.id, 0);
    const acceptedSubmissions = codingStats.find((g) => g.status === 'ACCEPTED')?._count.id ?? 0;

    // Unique solved problems
    const solvedCount = await prisma.submission.findMany({
      where: { userId, status: 'ACCEPTED' },
      distinct: ['problemId'],
      select: { problemId: true },
    });

    // Application breakdown
    const applicationsByStatus: Record<string, number> = {};
    jobApplications.forEach((g) => {
      applicationsByStatus[g.status] = g._count.id;
    });
    const totalApplications = jobApplications.reduce((acc, g) => acc + g._count.id, 0);

    // Resume completion score (average based on sections count)
    const avgSections =
      resumes.length > 0
        ? resumes.reduce((acc, r) => acc + r._count.sections, 0) / resumes.length
        : 0;
    const resumeCompletion = Math.min(Math.round((avgSections / 6) * 100), 100); // 6 standard sections

    return {
      learning: {
        completedLessons: learningProgress._count.id,
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
