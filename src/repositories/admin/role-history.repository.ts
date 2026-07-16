import { prisma } from '../../config/database';

export class RoleHistoryRepository {
  async create(data: {
    userId: string;
    oldRole: string;
    newRole: string;
    reason?: string;
    changedBy: string;
  }) {
    return prisma.roleHistory.create({ data });
  }

  async findByUser(userId: string) {
    return prisma.roleHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const roleHistoryRepository = new RoleHistoryRepository();
