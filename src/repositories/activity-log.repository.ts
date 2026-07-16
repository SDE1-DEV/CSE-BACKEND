import { ActivityLog, Prisma as _Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class ActivityLogRepository {
  async findByTeamId(
    teamId: string,
    pagination: PaginationOptions,
  ): Promise<{ data: ActivityLog[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { teamId },
        include: {
          user: { select: { id: true, fullName: true, email: true, profileImage: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      prisma.activityLog.count({ where: { teamId } }),
    ]);

    return { data: data as unknown as ActivityLog[], total };
  }
}

export const activityLogRepository = new ActivityLogRepository();
