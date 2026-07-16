import { prisma } from '../config/database';
import { TaskStatus, InvitationStatus } from '@prisma/client';

export class ProjectDashboardService {
  async getDashboard(userId: string) {
    const [
      activeTeams,
      assignedTasks,
      completedTasks,
      upcomingDeadlines,
      recentActivity,
      teamInvitations,
    ] = await Promise.all([
      // Active teams the user belongs to
      prisma.team.findMany({
        where: {
          members: { some: { userId } },
          status: { in: ['OPEN', 'FULL'] },
        },
        include: {
          project: { select: { id: true, title: true, slug: true, thumbnail: true } },
          _count: { select: { members: true, tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Assigned tasks (not completed)
      prisma.task.findMany({
        where: {
          assignedTo: userId,
          status: { not: TaskStatus.COMPLETED },
        },
        include: {
          team: { select: { id: true, name: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
        take: 10,
      }),

      // Completed tasks count
      prisma.task.count({
        where: {
          assignedTo: userId,
          status: TaskStatus.COMPLETED,
        },
      }),

      // Upcoming task deadlines (next 7 days)
      prisma.task.findMany({
        where: {
          team: { members: { some: { userId } } },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          status: { not: TaskStatus.COMPLETED },
        },
        include: {
          team: { select: { id: true, name: true } },
          assignee: { select: { id: true, fullName: true, profileImage: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),

      // Recent activity across all user's teams
      prisma.activityLog.findMany({
        where: {
          team: { members: { some: { userId } } },
        },
        include: {
          user: { select: { id: true, fullName: true, profileImage: true } },
          team: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Pending invitations received by user
      prisma.teamInvitation.findMany({
        where: {
          receiverId: userId,
          status: InvitationStatus.PENDING,
          expiresAt: { gt: new Date() },
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              project: { select: { id: true, title: true, thumbnail: true } },
            },
          },
          sender: { select: { id: true, fullName: true, profileImage: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      activeTeams,
      assignedTasks,
      completedTasksCount: completedTasks,
      upcomingDeadlines,
      recentActivity,
      teamInvitations,
    };
  }
}

export const projectDashboardService = new ProjectDashboardService();
