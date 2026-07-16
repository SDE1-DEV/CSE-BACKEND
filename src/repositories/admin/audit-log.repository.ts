import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export interface AuditLogFilters {
  role?: string;
  action?: string;
  module?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class AuditLogRepository {
  async findAll(filters: AuditLogFilters = {}) {
    const { role, action, module, userId, startDate, endDate, page = 1, limit = 20 } = filters;

    const where: Prisma.AuditLogWhereInput = {};
    if (role) where.role = role.toUpperCase();
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (module) where.module = module.toUpperCase();
    if (userId) where.performedBy = userId;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          performer: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async create(data: {
    performedBy: string;
    targetUser?: string | null;
    role: string;
    action: string;
    module?: string | null;
    entity?: string | null;
    entityId?: string | null;
    oldValue?: object | null;
    newValue?: object | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    return prisma.auditLog.create({
      data: {
        performedBy: data.performedBy,
        targetUser: data.targetUser ?? null,
        role: data.role,
        action: data.action,
        module: data.module ?? null,
        entity: data.entity ?? null,
        entityId: data.entityId ?? null,
        oldValue: data.oldValue ? (data.oldValue as Prisma.InputJsonValue) : Prisma.JsonNull,
        newValue: data.newValue ? (data.newValue as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
