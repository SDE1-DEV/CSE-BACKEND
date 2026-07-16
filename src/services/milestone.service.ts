import { MilestoneStatus } from '@prisma/client';
import { milestoneRepository } from '../repositories/milestone.repository';
import { projectRepository } from '../repositories/project.repository';
import { teamRepository } from '../repositories/team.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PROJECT_MESSAGES } from '../constants';
import { projectEventEmitter } from '../events/project-events';
import type { CreateMilestoneInput, UpdateMilestoneInput } from '../validators/milestone.validator';

export class MilestoneService {
  async createMilestone(data: CreateMilestoneInput, _userId: string) {
    const project = await projectRepository.findById(data.projectId);
    if (!project) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_NOT_FOUND);
    }

    return milestoneRepository.create({
      project: { connect: { id: data.projectId } },
      title: data.title,
      description: data.description ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: data.status ?? MilestoneStatus.PENDING,
      completionPercentage: data.completionPercentage ?? 0,
    });
  }

  async getMilestones(query: {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: string;
  }) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const { data, total } = await milestoneRepository.findAll(
      { projectId: query.projectId, status: query.status },
      { page, limit },
    );

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateMilestone(id: string, data: UpdateMilestoneInput, userId: string) {
    const milestone = await milestoneRepository.findById(id);
    if (!milestone) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.MILESTONE_NOT_FOUND);
    }

    const wasCompleted = milestone.status !== MilestoneStatus.COMPLETED;
    const isNowCompleted = data.status === MilestoneStatus.COMPLETED;

    const updateData: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      status: data.status,
      completionPercentage: data.completionPercentage,
    };

    Object.keys(updateData).forEach((k) => {
      if (updateData[k] === undefined) delete updateData[k];
    });

    const updated = await milestoneRepository.update(id, updateData);

    if (wasCompleted && isNowCompleted) {
      // Find a team for this project to log activity
      const teams = await teamRepository.findAll({ projectId: milestone.projectId }, { page: 1, limit: 1 });
      if (teams.data.length > 0) {
        projectEventEmitter.emit('milestone:completed', {
          milestoneId: id,
          projectId: milestone.projectId,
          teamId: teams.data[0].id,
          userId,
          milestoneTitle: updated.title,
        });
      }
    }

    return updated;
  }

  async deleteMilestone(id: string, _userId: string): Promise<void> {
    const milestone = await milestoneRepository.findById(id);
    if (!milestone) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.MILESTONE_NOT_FOUND);
    }
    await milestoneRepository.delete(id);
  }
}

export const milestoneService = new MilestoneService();
