/**
 * Activity Log Listener
 * - Writes activity log entries to DB
 * - Broadcasts real-time team activity via WebSocket (PRD-06: Section 5)
 * - Broadcasts invitation updates via WebSocket
 */

import { prisma } from '../config/database';
import { ActivityAction, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { projectEventEmitter } from './project-events';
import { wsGateway } from '../websocket/gateway';

const logActivity = async (
  teamId: string,
  userId: string,
  action: ActivityAction,
  metadata?: Record<string, unknown>,
): Promise<void> => {
  try {
    const log = await prisma.activityLog.create({
      data: {
        teamId,
        userId,
        action,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    // Broadcast live team activity to all team members
    wsGateway.emitToTeam(teamId, 'team:activity', {
      id: log.id,
      teamId,
      userId,
      action,
      metadata,
      createdAt: log.createdAt,
    });
  } catch (err) {
    logger.error('Failed to write activity log', { teamId, userId, action, err });
  }
};

export const registerActivityListeners = (): void => {
  projectEventEmitter.on('team:created', async ({ teamId, ownerId }) => {
    await logActivity(teamId, ownerId, ActivityAction.TEAM_CREATED, { teamId });
  });

  projectEventEmitter.on('member:joined', async ({ teamId, userId, role }) => {
    await logActivity(teamId, userId, ActivityAction.MEMBER_JOINED, { role });
  });

  projectEventEmitter.on('task:assigned', async ({ teamId, assignedBy, taskId, taskTitle, assignedTo }) => {
    await logActivity(teamId, assignedBy, ActivityAction.TASK_ASSIGNED, {
      taskId, taskTitle, assignedTo,
    });

    // Notify the assignee in real-time: task status update
    wsGateway.emitToUser(assignedTo, 'task:update', {
      type: 'assigned',
      taskId,
      taskTitle,
      teamId,
    });
  });

  projectEventEmitter.on('task:completed', async ({ teamId, userId, taskId, taskTitle }) => {
    await logActivity(teamId, userId, ActivityAction.TASK_COMPLETED, { taskId, taskTitle });
    wsGateway.emitToTeam(teamId, 'task:update', { type: 'completed', taskId, taskTitle });
  });

  projectEventEmitter.on('task:updated', async ({ teamId, userId, taskId, taskTitle, changes }) => {
    await logActivity(teamId, userId, ActivityAction.TASK_UPDATED, { taskId, taskTitle, changes });
    wsGateway.emitToTeam(teamId, 'task:update', { type: 'updated', taskId, taskTitle, changes });
  });

  projectEventEmitter.on('milestone:completed', async ({ teamId, userId, milestoneId, milestoneTitle }) => {
    await logActivity(teamId, userId, ActivityAction.MILESTONE_COMPLETED, { milestoneId, milestoneTitle });

    // Trigger dashboard refresh for team members
    wsGateway.emitToTeam(teamId, 'dashboard:refresh', { reason: 'milestone_completed', milestoneId });
  });

  projectEventEmitter.on('file:uploaded', async ({ teamId, userId, fileId, fileName }) => {
    await logActivity(teamId, userId, ActivityAction.FILE_UPLOADED, { fileId, fileName });
  });

  projectEventEmitter.on('comment:added', async ({ teamId, userId, commentId, taskId }) => {
    await logActivity(teamId, userId, ActivityAction.COMMENT_ADDED, { commentId, taskId });
  });

  projectEventEmitter.on('member:removed', async ({ teamId, removedBy, userId }) => {
    await logActivity(teamId, removedBy, ActivityAction.MEMBER_REMOVED, { removedUserId: userId });
    wsGateway.emitToUser(userId, 'team:activity', { type: 'removed', teamId });
  });

  projectEventEmitter.on('invitation:sent', async ({ teamId, senderId, receiverId, invitationId }) => {
    await logActivity(teamId, senderId, ActivityAction.INVITATION_SENT, { invitationId, receiverId });

    // Notify receiver in real-time
    wsGateway.emitToUser(receiverId, 'invitation:update', {
      type: 'received',
      invitationId,
      teamId,
    });
  });

  projectEventEmitter.on('invitation:accepted', async ({ teamId, userId, invitationId }) => {
    await logActivity(teamId, userId, ActivityAction.INVITATION_ACCEPTED, { invitationId });
    wsGateway.emitToTeam(teamId, 'invitation:update', { type: 'accepted', userId, invitationId });
    wsGateway.emitToTeam(teamId, 'dashboard:refresh', { reason: 'member_joined' });
  });

  logger.info('Activity listeners registered');
};
