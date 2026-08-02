import { Notification, NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export class NotificationRepository {
  async create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    return prisma.notification.create({ data });
  }

  async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({ where: { id } });
  }

  async findByUser(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  async markRead(id: string): Promise<Notification> {
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }

  async delete(id: string): Promise<void> {
    await prisma.notification.delete({ where: { id } });
  }

  async deleteAllRead(userId: string): Promise<void> {
    await prisma.notification.deleteMany({ where: { userId, isRead: true } });
  }

  async createForUser(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: Record<string, unknown>,
  ): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }
}

export const notificationRepository = new NotificationRepository();
