import { Event } from '@prisma/client';
import { eventRepository, EventFilters } from '../repositories/event.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PLACEMENT_MESSAGES } from '../constants';
import { CreateEventInput, UpdateEventInput } from '../validators/event.validator';
import { platformEventEmitter } from '../events/platform-events';
import { enqueueEmail } from '../queues/email.queue';
import { prisma } from '../config/database';

export class EventService {
  async create(data: CreateEventInput): Promise<Event> {
    return eventRepository.create({
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      organizer: data.organizer ?? null,
      location: data.location ?? null,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      registrationUrl: data.registrationUrl ?? null,
      maxParticipants: data.maxParticipants ?? null,
      isPublished: data.isPublished ?? false,
    });
  }

  async getAll(filters: EventFilters & { page?: number; limit?: number }, isAdmin = false) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 50);
    const filterArgs: EventFilters = {
      type: filters.type,
      search: filters.search,
      isPublished: isAdmin ? filters.isPublished : true,
    };
    return eventRepository.findAll(filterArgs, page, limit);
  }

  async getById(id: string): Promise<Event> {
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.EVENT_NOT_FOUND);
    return event;
  }

  async update(id: string, data: UpdateEventInput): Promise<Event> {
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.EVENT_NOT_FOUND);

    return eventRepository.update(id, {
      ...data,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
    });
  }

  async delete(id: string): Promise<void> {
    const event = await eventRepository.findById(id);
    if (!event) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.EVENT_NOT_FOUND);
    await eventRepository.delete(id);
  }

  async register(eventId: string, userId: string): Promise<void> {
    const event = await eventRepository.findById(eventId);
    if (!event) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.EVENT_NOT_FOUND);

    const existing = await eventRepository.findRegistration(eventId, userId);
    if (existing) throw new AppError(HTTP_STATUS.CONFLICT, PLACEMENT_MESSAGES.EVENT_ALREADY_REGISTERED);

    if (event.maxParticipants !== null) {
      const count = await eventRepository.countRegistrations(eventId);
      if (count >= event.maxParticipants) {
        throw new AppError(HTTP_STATUS.CONFLICT, PLACEMENT_MESSAGES.EVENT_FULL);
      }
    }

    await eventRepository.createRegistration(eventId, userId);

    platformEventEmitter.emit('event:registered', {
      userId,
      eventId,
      eventTitle: event.title,
    });

    // Enqueue confirmation email (async)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user) {
      void enqueueEmail({
        type: 'email:event-registration',
        to: user.email,
        payload: {
          eventTitle: event.title,
          eventDate: event.startTime.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          }),
        },
      });
    }
  }

  async unregister(eventId: string, userId: string): Promise<void> {
    const registration = await eventRepository.findRegistration(eventId, userId);
    if (!registration) throw new AppError(HTTP_STATUS.NOT_FOUND, PLACEMENT_MESSAGES.EVENT_NOT_REGISTERED);
    await eventRepository.deleteRegistration(eventId, userId);
  }

  async getMyEvents(userId: string, page: number, limit: number) {
    return eventRepository.findUserEvents(userId, page, Math.min(limit, 50));
  }
}

export const eventService = new EventService();
