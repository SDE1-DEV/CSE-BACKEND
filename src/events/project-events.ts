/**
 * PRD-04 Architectural Recommendation:
 * Reusable event-driven layer for domain events.
 * Services emit events; listeners handle side effects (activity logs, notifications, emails, future WebSockets).
 */

import { EventEmitter } from 'events';

export interface TeamCreatedEvent {
  teamId: string;
  teamName: string;
  projectId: string;
  ownerId: string;
}

export interface MemberJoinedEvent {
  teamId: string;
  userId: string;
  role: string;
}

export interface TaskAssignedEvent {
  taskId: string;
  teamId: string;
  assignedTo: string;
  assignedBy: string;
  taskTitle: string;
}

export interface TaskCompletedEvent {
  taskId: string;
  teamId: string;
  userId: string;
  taskTitle: string;
}

export interface TaskUpdatedEvent {
  taskId: string;
  teamId: string;
  userId: string;
  taskTitle: string;
  changes: Record<string, unknown>;
}

export interface MilestoneCompletedEvent {
  milestoneId: string;
  projectId: string;
  teamId: string;
  userId: string;
  milestoneTitle: string;
}

export interface FileUploadedEvent {
  fileId: string;
  projectId: string;
  teamId: string;
  userId: string;
  fileName: string;
}

export interface CommentAddedEvent {
  commentId: string;
  taskId: string;
  teamId: string;
  userId: string;
}

export interface MemberRemovedEvent {
  teamId: string;
  userId: string;
  removedBy: string;
}

export interface InvitationSentEvent {
  invitationId: string;
  teamId: string;
  senderId: string;
  receiverId: string;
}

export interface InvitationAcceptedEvent {
  invitationId: string;
  teamId: string;
  userId: string;
}

export interface ProjectCreatedEvent {
  projectId: string;
  title: string;
  categoryId: string;
  createdBy?: string;
}

export type ProjectEventMap = {
  'team:created': [TeamCreatedEvent];
  'member:joined': [MemberJoinedEvent];
  'task:assigned': [TaskAssignedEvent];
  'task:completed': [TaskCompletedEvent];
  'task:updated': [TaskUpdatedEvent];
  'milestone:completed': [MilestoneCompletedEvent];
  'file:uploaded': [FileUploadedEvent];
  'comment:added': [CommentAddedEvent];
  'member:removed': [MemberRemovedEvent];
  'invitation:sent': [InvitationSentEvent];
  'invitation:accepted': [InvitationAcceptedEvent];
  'project:created': [ProjectCreatedEvent];
};

class ProjectEventEmitter extends EventEmitter {
  emit<K extends keyof ProjectEventMap>(event: K, ...args: ProjectEventMap[K]): boolean {
    return super.emit(event as string, ...args);
  }

  on<K extends keyof ProjectEventMap>(
    event: K,
    listener: (...args: ProjectEventMap[K]) => void,
  ): this {
    return super.on(event as string, listener as (...args: unknown[]) => void);
  }
}

export const projectEventEmitter = new ProjectEventEmitter();
