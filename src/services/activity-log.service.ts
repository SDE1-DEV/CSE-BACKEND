import { activityLogRepository } from '../repositories/activity-log.repository';
import { teamRepository } from '../repositories/team.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PROJECT_MESSAGES } from '../constants';

export class ActivityLogService {
  async getTeamActivity(
    teamId: string,
    userId: string,
    page: number,
    limit: number,
  ) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TEAM_NOT_FOUND);

    const normalizedPage = page ?? 1;
    const normalizedLimit = Math.min(limit ?? 20, 100);

    const { data, total } = await activityLogRepository.findByTeamId(teamId, {
      page: normalizedPage,
      limit: normalizedLimit,
    });

    return {
      data,
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      totalPages: Math.ceil(total / normalizedLimit),
    };
  }
}

export const activityLogService = new ActivityLogService();
