import { TaskStatus, TeamMemberRole } from '@prisma/client';
import { taskRepository } from '../repositories/task.repository';
import { teamRepository } from '../repositories/team.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PROJECT_MESSAGES } from '../constants';
import { projectEventEmitter } from '../events/project-events';
import type { CreateTaskInput, UpdateTaskInput } from '../validators/task.validator';

export class TaskService {
  async createTask(data: CreateTaskInput, creatorId: string) {
    const team = await teamRepository.findById(data.teamId);
    if (!team) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TEAM_NOT_FOUND);

    const requester = await teamRepository.findMember(data.teamId, creatorId);
    if (!requester) throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TEAM_NOT_MEMBER);

    if (
      requester.role !== TeamMemberRole.OWNER &&
      requester.role !== TeamMemberRole.LEADER
    ) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TASK_FORBIDDEN);
    }

    if (data.assignedTo) {
      const assignee = await teamRepository.findMember(data.teamId, data.assignedTo);
      if (!assignee) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Assignee must be a team member');
      }
    }

    const task = await taskRepository.create({
      team: { connect: { id: data.teamId } },
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? 'MEDIUM',
      status: data.status ?? 'TODO',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      estimatedHours: data.estimatedHours ?? null,
      ...(data.assignedTo ? { assignee: { connect: { id: data.assignedTo } } } : {}),
    });

    if (data.assignedTo) {
      projectEventEmitter.emit('task:assigned', {
        taskId: task.id,
        teamId: data.teamId,
        assignedTo: data.assignedTo,
        assignedBy: creatorId,
        taskTitle: task.title,
      });
    }

    return task;
  }

  async getTasks(
    query: {
      page?: number;
      limit?: number;
      teamId?: string;
      assignedTo?: string;
      status?: string;
      priority?: string;
    },
    _userId: string,
  ) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const filters = {
      teamId: query.teamId,
      assignedTo: query.assignedTo,
      status: query.status,
      priority: query.priority,
    };

    const { data, total } = await taskRepository.findAll(filters, { page, limit });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateTask(id: string, data: UpdateTaskInput, userId: string) {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TASK_NOT_FOUND);

    const member = await teamRepository.findMember(task.teamId, userId);
    if (!member) throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TEAM_NOT_MEMBER);

    const isOwnerOrLeader =
      member.role === TeamMemberRole.OWNER || member.role === TeamMemberRole.LEADER;
    const isAssignee = task.assignedTo === userId;

    // Completed tasks are immutable unless reopened by owner/leader
    if (
      task.status === TaskStatus.COMPLETED &&
      data.status !== TaskStatus.TODO &&
      data.status !== TaskStatus.IN_PROGRESS &&
      !isOwnerOrLeader
    ) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TASK_IMMUTABLE);
    }

    // Non-owner/leader can only update their own task's status
    if (!isOwnerOrLeader && !isAssignee) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TASK_FORBIDDEN);
    }

    if (data.assignedTo && !isOwnerOrLeader) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TASK_FORBIDDEN);
    }

    if (data.assignedTo) {
      const assignee = await teamRepository.findMember(task.teamId, data.assignedTo);
      if (!assignee) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Assignee must be a team member');
      }
    }

    const wasAssigned =
      data.assignedTo && data.assignedTo !== task.assignedTo;

    const updateData: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      estimatedHours: data.estimatedHours,
    };

    if (data.assignedTo !== undefined) {
      updateData.assignee = data.assignedTo
        ? { connect: { id: data.assignedTo } }
        : { disconnect: true };
    }

    // Remove undefined
    Object.keys(updateData).forEach((k) => {
      if (updateData[k] === undefined) delete updateData[k];
    });

    const updated = await taskRepository.update(id, updateData);

    if (wasAssigned && data.assignedTo) {
      projectEventEmitter.emit('task:assigned', {
        taskId: id,
        teamId: task.teamId,
        assignedTo: data.assignedTo,
        assignedBy: userId,
        taskTitle: updated.title,
      });
    }

    if (data.status === TaskStatus.COMPLETED) {
      projectEventEmitter.emit('task:completed', {
        taskId: id,
        teamId: task.teamId,
        userId,
        taskTitle: updated.title,
      });
    } else {
      projectEventEmitter.emit('task:updated', {
        taskId: id,
        teamId: task.teamId,
        userId,
        taskTitle: updated.title,
        changes: data as Record<string, unknown>,
      });
    }

    return updated;
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TASK_NOT_FOUND);

    const member = await teamRepository.findMember(task.teamId, userId);
    if (!member) throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TEAM_NOT_MEMBER);

    if (member.role !== TeamMemberRole.OWNER && member.role !== TeamMemberRole.LEADER) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TASK_FORBIDDEN);
    }

    await taskRepository.delete(id);
  }
}

export const taskService = new TaskService();
