import { teamCommentRepository } from '../repositories/team-comment.repository';
import { taskRepository } from '../repositories/task.repository';
import { teamRepository } from '../repositories/team.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PROJECT_MESSAGES } from '../constants';
import { projectEventEmitter } from '../events/project-events';

export class TeamCommentService {
  async createComment(taskId: string, userId: string, content: string) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TASK_NOT_FOUND);

    const member = await teamRepository.findMember(task.teamId, userId);
    if (!member) throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TEAM_NOT_MEMBER);

    const comment = await teamCommentRepository.create({
      task: { connect: { id: taskId } },
      user: { connect: { id: userId } },
      content,
    });

    projectEventEmitter.emit('comment:added', {
      commentId: comment.id,
      taskId,
      teamId: task.teamId,
      userId,
    });

    return comment;
  }

  async getCommentsByTask(taskId: string, page: number, limit: number) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TASK_NOT_FOUND);

    const normalizedPage = page ?? 1;
    const normalizedLimit = Math.min(limit ?? 20, 100);

    const { data, total } = await teamCommentRepository.findByTaskId(taskId, {
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

  async updateComment(id: string, userId: string, content: string) {
    const comment = await teamCommentRepository.findById(id);
    if (!comment) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.COMMENT_NOT_FOUND);

    if (comment.userId !== userId) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.COMMENT_FORBIDDEN);
    }

    return teamCommentRepository.update(id, content);
  }

  async deleteComment(id: string, userId: string): Promise<void> {
    const comment = await teamCommentRepository.findById(id);
    if (!comment) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.COMMENT_NOT_FOUND);

    if (comment.userId !== userId) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.COMMENT_FORBIDDEN);
    }

    await teamCommentRepository.delete(id);
  }
}

export const teamCommentService = new TeamCommentService();
