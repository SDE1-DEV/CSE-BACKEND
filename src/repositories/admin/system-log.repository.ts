import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export type SystemLogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface SystemLogFilters {
  level?: string;
  module?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class SystemLogRepository {
  async create(data: {
    level: string;
    module: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.systemLog.create({
      data: {
        level: data.level,
        module: data.module,
        message: data.message,
        metadata: data.metadata ? (data.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }

  async findAll(filters: SystemLogFilters = {}) {
    const { level, module, startDate, endDate, page = 1, limit = 50 } = filters;

    const where: Prisma.SystemLogWhereInput = {};
    if (level) where.level = level.toLowerCase();
    if (module) where.module = { contains: module, mode: 'insensitive' };
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const [data, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.systemLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  /** Write a system log entry — fire-and-forget helper */
  static async writeAsync(
    level: string,
    module: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    prisma.systemLog
      .create({
        data: {
          level,
          module,
          message,
          metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      })
      .catch(() => {
        // silently ignore — system logs must never crash the app
      });
  }
}

export const systemLogRepository = new SystemLogRepository();
