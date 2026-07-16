import { TeamStatus, TeamMemberRole, InvitationStatus } from '@prisma/client';
import { teamRepository } from '../repositories/team.repository';
import { projectRepository } from '../repositories/project.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PROJECT_MESSAGES } from '../constants';
import { projectEventEmitter } from '../events/project-events';
import type { CreateTeamInput, UpdateTeamInput } from '../validators/team.validator';
import type { SendInvitationInput, UpdateInvitationInput } from '../validators/team-invitation.validator';
import { prisma } from '../config/database';
import { enqueueEmail } from '../queues/email.queue';

export class TeamService {
  // ── Teams ──────────────────────────────────────────────────────────────────

  async createTeam(data: CreateTeamInput, ownerId: string) {
    const project = await projectRepository.findById(data.projectId);
    if (!project) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_NOT_FOUND);
    }

    const team = await teamRepository.create({
      name: data.name,
      maxMembers: data.maxMembers ?? 5,
      status: TeamStatus.OPEN,
      project: { connect: { id: data.projectId } },
      owner: { connect: { id: ownerId } },
    });

    // Owner is automatically a member with OWNER role
    await teamRepository.addMember(team.id, ownerId, TeamMemberRole.OWNER);

    projectEventEmitter.emit('team:created', {
      teamId: team.id,
      teamName: team.name,
      projectId: team.projectId,
      ownerId,
    });

    return teamRepository.findById(team.id);
  }

  async getTeamById(id: string) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TEAM_NOT_FOUND);
    }
    return team;
  }

  async getMyTeams(userId: string) {
    return teamRepository.findByUserId(userId);
  }

  async updateTeam(id: string, data: UpdateTeamInput, userId: string) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TEAM_NOT_FOUND);
    }

    const member = await teamRepository.findMember(id, userId);
    if (!member || (member.role !== TeamMemberRole.OWNER && member.role !== TeamMemberRole.LEADER)) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TEAM_ONLY_OWNER_DELETE);
    }

    return teamRepository.update(id, data);
  }

  async deleteTeam(id: string, userId: string): Promise<void> {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TEAM_NOT_FOUND);
    }

    if (team.ownerId !== userId) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TEAM_ONLY_OWNER_DELETE);
    }

    await teamRepository.delete(id);
  }

  // ── Members ────────────────────────────────────────────────────────────────

  async addMember(teamId: string, targetUserId: string, role: TeamMemberRole, requesterId: string) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TEAM_NOT_FOUND);

    if (team.status === TeamStatus.CLOSED || team.status === TeamStatus.COMPLETED) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, PROJECT_MESSAGES.TEAM_CLOSED);
    }

    const existingMember = await teamRepository.findMember(teamId, targetUserId);
    if (existingMember) {
      throw new AppError(HTTP_STATUS.CONFLICT, PROJECT_MESSAGES.TEAM_ALREADY_MEMBER);
    }

    const requesterMember = await teamRepository.findMember(teamId, requesterId);
    if (
      !requesterMember ||
      (requesterMember.role !== TeamMemberRole.OWNER && requesterMember.role !== TeamMemberRole.LEADER)
    ) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.INVITATION_ONLY_OWNER_LEADER);
    }

    const memberCount = await teamRepository.getMemberCount(teamId);
    if (memberCount >= team.maxMembers) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, PROJECT_MESSAGES.TEAM_FULL);
    }

    const member = await teamRepository.addMember(teamId, targetUserId, role);

    if (memberCount + 1 >= team.maxMembers) {
      await teamRepository.update(teamId, { status: TeamStatus.FULL });
    }

    projectEventEmitter.emit('member:joined', { teamId, userId: targetUserId, role });
    return member;
  }

  async removeMember(teamId: string, memberId: string, requesterId: string): Promise<void> {
    const team = await teamRepository.findById(teamId);
    if (!team) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TEAM_NOT_FOUND);

    const requester = await teamRepository.findMember(teamId, requesterId);
    if (!requester || requester.role !== TeamMemberRole.OWNER) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TEAM_ONLY_OWNER_DELETE);
    }

    const targetMember = await teamRepository.findMember(teamId, memberId);
    if (!targetMember) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.MEMBER_NOT_FOUND);
    }

    if (memberId === team.ownerId) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Cannot remove the team owner');
    }

    await teamRepository.removeMember(teamId, memberId);

    // Re-open team if it was full
    if (team.status === TeamStatus.FULL) {
      await teamRepository.update(teamId, { status: TeamStatus.OPEN });
    }

    projectEventEmitter.emit('member:removed', { teamId, userId: memberId, removedBy: requesterId });
  }

  async updateMemberRole(teamId: string, memberId: string, role: TeamMemberRole, requesterId: string) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TEAM_NOT_FOUND);

    const requester = await teamRepository.findMember(teamId, requesterId);
    if (!requester || requester.role !== TeamMemberRole.OWNER) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.TEAM_ONLY_OWNER_DELETE);
    }

    const targetMember = await teamRepository.findMember(teamId, memberId);
    if (!targetMember) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.MEMBER_NOT_FOUND);
    }

    if (role === TeamMemberRole.OWNER) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Cannot assign OWNER role via member update');
    }

    return teamRepository.updateMemberRole(teamId, memberId, role);
  }

  // ── Invitations ────────────────────────────────────────────────────────────

  async sendInvitation(data: SendInvitationInput, senderId: string) {
    const team = await teamRepository.findById(data.teamId);
    if (!team) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TEAM_NOT_FOUND);

    if (team.status === TeamStatus.CLOSED || team.status === TeamStatus.COMPLETED) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, PROJECT_MESSAGES.TEAM_CLOSED);
    }

    const sender = await teamRepository.findMember(data.teamId, senderId);
    if (!sender || (sender.role !== TeamMemberRole.OWNER && sender.role !== TeamMemberRole.LEADER)) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.INVITATION_ONLY_OWNER_LEADER);
    }

    const alreadyMember = await teamRepository.findMember(data.teamId, data.receiverId);
    if (alreadyMember) {
      throw new AppError(HTTP_STATUS.CONFLICT, PROJECT_MESSAGES.TEAM_ALREADY_MEMBER);
    }

    const existing = await teamRepository.findPendingInvitation(data.teamId, data.receiverId);
    if (existing) {
      throw new AppError(HTTP_STATUS.CONFLICT, PROJECT_MESSAGES.INVITATION_ALREADY_SENT);
    }

    const memberCount = await teamRepository.getMemberCount(data.teamId);
    if (memberCount >= team.maxMembers) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, PROJECT_MESSAGES.TEAM_FULL);
    }

    // Check receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: data.receiverId } });
    if (!receiver) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, 'Receiver user not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays ?? 7));

    const invitation = await teamRepository.createInvitation({
      team: { connect: { id: data.teamId } },
      sender: { connect: { id: senderId } },
      receiver: { connect: { id: data.receiverId } },
      status: InvitationStatus.PENDING,
      expiresAt,
    });

    projectEventEmitter.emit('invitation:sent', {
      invitationId: invitation.id,
      teamId: data.teamId,
      senderId,
      receiverId: data.receiverId,
    });

    // Enqueue invitation email (async — non-blocking)
    const senderUser = await prisma.user.findUnique({ where: { id: senderId }, select: { fullName: true } });
    void enqueueEmail({
      type: 'email:team-invitation',
      to: receiver.email,
      payload: {
        teamName: team.name,
        senderName: senderUser?.fullName ?? 'A team member',
      },
    });

    return invitation;
  }

  async getMyInvitations(userId: string, type: 'sent' | 'received') {
    await teamRepository.expireOldInvitations();
    return teamRepository.findInvitationsForUser(userId, type);
  }

  async respondToInvitation(id: string, data: UpdateInvitationInput, userId: string) {
    await teamRepository.expireOldInvitations();

    const invitation = await teamRepository.findInvitationById(id);
    if (!invitation) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.INVITATION_NOT_FOUND);
    }

    if (invitation.receiverId !== userId) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, PROJECT_MESSAGES.INVITATION_FORBIDDEN);
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, `Invitation is already ${invitation.status.toLowerCase()}`);
    }

    if (invitation.expiresAt < new Date()) {
      await teamRepository.updateInvitation(id, { status: InvitationStatus.EXPIRED });
      throw new AppError(HTTP_STATUS.BAD_REQUEST, PROJECT_MESSAGES.INVITATION_EXPIRED);
    }

    const updated = await teamRepository.updateInvitation(id, { status: data.status });

    if (data.status === InvitationStatus.ACCEPTED) {
      const team = await teamRepository.findById(invitation.teamId);
      if (!team) throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.TEAM_NOT_FOUND);

      if (team.status === TeamStatus.FULL || team.status === TeamStatus.CLOSED) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, PROJECT_MESSAGES.TEAM_FULL);
      }

      const alreadyMember = await teamRepository.findMember(invitation.teamId, userId);
      if (!alreadyMember) {
        const memberCount = await teamRepository.getMemberCount(invitation.teamId);
        await teamRepository.addMember(invitation.teamId, userId, TeamMemberRole.DEVELOPER);

        if (memberCount + 1 >= team.maxMembers) {
          await teamRepository.update(invitation.teamId, { status: TeamStatus.FULL });
        }
      }

      projectEventEmitter.emit('invitation:accepted', {
        invitationId: id,
        teamId: invitation.teamId,
        userId,
      });

      projectEventEmitter.emit('member:joined', {
        teamId: invitation.teamId,
        userId,
        role: TeamMemberRole.DEVELOPER,
      });
    }

    return updated;
  }
}

export const teamService = new TeamService();
