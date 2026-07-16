import { Team, TeamMember, TeamInvitation, Prisma, TeamMemberRole, InvitationStatus } from '@prisma/client';
import { prisma } from '../config/database';

export interface TeamFilters {
  projectId?: string;
  ownerId?: string;
  status?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class TeamRepository {
  // ── Team CRUD ──────────────────────────────────────────────────────────────

  async create(data: Prisma.TeamCreateInput) {
    return prisma.team.create({
      data,
      include: {
        project: { select: { id: true, title: true, slug: true } },
        owner: { select: { id: true, fullName: true, email: true, profileImage: true } },
        _count: { select: { members: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.team.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, title: true, slug: true, thumbnail: true } },
        owner: { select: { id: true, fullName: true, email: true, profileImage: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true, profileImage: true } },
          },
        },
        _count: { select: { members: true, tasks: true } },
      },
    });
  }

  async findAll(
    filters: TeamFilters,
    pagination: PaginationOptions,
  ): Promise<{ data: Team[]; total: number }> {
    const where: Prisma.TeamWhereInput = {};

    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.status) where.status = filters.status as Prisma.EnumTeamStatusFilter;

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          project: { select: { id: true, title: true, slug: true } },
          owner: { select: { id: true, fullName: true, email: true, profileImage: true } },
          _count: { select: { members: true, tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      prisma.team.count({ where }),
    ]);

    return { data: data as unknown as Team[], total };
  }

  async findByUserId(userId: string) {
    return prisma.team.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        project: { select: { id: true, title: true, slug: true, thumbnail: true } },
        owner: { select: { id: true, fullName: true, email: true, profileImage: true } },
        _count: { select: { members: true, tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Prisma.TeamUpdateInput) {
    return prisma.team.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, title: true, slug: true } },
        owner: { select: { id: true, fullName: true, email: true, profileImage: true } },
        _count: { select: { members: true } },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.team.delete({ where: { id } });
  }

  async getMemberCount(teamId: string): Promise<number> {
    return prisma.teamMember.count({ where: { teamId } });
  }

  // ── Members ────────────────────────────────────────────────────────────────

  async addMember(teamId: string, userId: string, role: TeamMemberRole): Promise<TeamMember> {
    return prisma.teamMember.create({
      data: { teamId, userId, role },
      include: {
        user: { select: { id: true, fullName: true, email: true, profileImage: true } },
      } as Prisma.TeamMemberInclude,
    });
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await prisma.teamMember.deleteMany({ where: { teamId, userId } });
  }

  async updateMemberRole(teamId: string, userId: string, role: TeamMemberRole): Promise<TeamMember> {
    return prisma.teamMember.update({
      where: { teamId_userId: { teamId, userId } },
      data: { role },
      include: {
        user: { select: { id: true, fullName: true, email: true, profileImage: true } },
      } as Prisma.TeamMemberInclude,
    });
  }

  async findMember(teamId: string, userId: string): Promise<TeamMember | null> {
    return prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
  }

  async getMembers(teamId: string) {
    return prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: { select: { id: true, fullName: true, email: true, profileImage: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  // ── Invitations ────────────────────────────────────────────────────────────

  async createInvitation(data: Prisma.TeamInvitationCreateInput): Promise<TeamInvitation> {
    return prisma.teamInvitation.create({ data });
  }

  async findInvitationById(id: string): Promise<TeamInvitation | null> {
    return prisma.teamInvitation.findUnique({ where: { id } });
  }

  async findPendingInvitation(
    teamId: string,
    receiverId: string,
  ): Promise<TeamInvitation | null> {
    return prisma.teamInvitation.findFirst({
      where: { teamId, receiverId, status: InvitationStatus.PENDING },
    });
  }

  async findInvitationsForUser(userId: string, type: 'sent' | 'received') {
    const where: Prisma.TeamInvitationWhereInput =
      type === 'sent' ? { senderId: userId } : { receiverId: userId };

    return prisma.teamInvitation.findMany({
      where,
      include: {
        team: { select: { id: true, name: true, projectId: true } },
        sender: { select: { id: true, fullName: true, email: true, profileImage: true } },
        receiver: { select: { id: true, fullName: true, email: true, profileImage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateInvitation(id: string, data: Prisma.TeamInvitationUpdateInput): Promise<TeamInvitation> {
    return prisma.teamInvitation.update({ where: { id }, data });
  }

  async expireOldInvitations(): Promise<void> {
    await prisma.teamInvitation.updateMany({
      where: { status: InvitationStatus.PENDING, expiresAt: { lt: new Date() } },
      data: { status: InvitationStatus.EXPIRED },
    });
  }
}

export const teamRepository = new TeamRepository();
