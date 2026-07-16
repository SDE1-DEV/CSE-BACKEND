import { Event, EventRegistration, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface EventFilters {
  type?: string;
  isPublished?: boolean;
  search?: string;
}

export class EventRepository {
  async create(data: Prisma.EventCreateInput): Promise<Event> {
    return prisma.event.create({ data });
  }

  async findById(id: string): Promise<Event | null> {
    return prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });
  }

  async findAll(filters: EventFilters, page: number, limit: number) {
    const where: Prisma.EventWhereInput = {};
    if (filters.isPublished !== undefined) where.isPublished = filters.isPublished;
    if (filters.type) where.type = filters.type as Prisma.EnumEventTypeFilter;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: { _count: { select: { registrations: true } } },
        orderBy: { startTime: 'asc' },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, data: Prisma.EventUpdateInput): Promise<Event> {
    return prisma.event.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.event.delete({ where: { id } });
  }

  async countRegistrations(eventId: string): Promise<number> {
    return prisma.eventRegistration.count({ where: { eventId } });
  }

  async findRegistration(eventId: string, userId: string): Promise<EventRegistration | null> {
    return prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
  }

  async createRegistration(eventId: string, userId: string): Promise<EventRegistration> {
    return prisma.eventRegistration.create({ data: { eventId, userId } });
  }

  async deleteRegistration(eventId: string, userId: string): Promise<void> {
    await prisma.eventRegistration.delete({ where: { eventId_userId: { eventId, userId } } });
  }

  async findUserEvents(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where: { userId },
        include: { event: true },
        orderBy: { registeredAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.eventRegistration.count({ where: { userId } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export const eventRepository = new EventRepository();
