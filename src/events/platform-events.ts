/**
 * PRD-05 Platform Event Emitter
 * Extends the event-driven architecture from PRD-04 with placement, event, and notification events.
 * Notifications are generated through domain events — never directly from business services.
 */

import { EventEmitter } from 'events';

export interface ApplicationCreatedEvent {
  userId: string;
  jobId: string;
  applicationId: string;
  jobTitle: string;
}

export interface EventRegisteredEvent {
  userId: string;
  eventId: string;
  eventTitle: string;
}

export interface ResumeCreatedEvent {
  userId: string;
  resumeId: string;
  resumeTitle: string;
}

export interface JobPublishedEvent {
  jobId: string;
  jobTitle: string;
  companyName: string;
}

export type PlatformEventMap = {
  'application:created': [ApplicationCreatedEvent];
  'event:registered': [EventRegisteredEvent];
  'resume:created': [ResumeCreatedEvent];
  'job:published': [JobPublishedEvent];
};

class PlatformEventEmitter extends EventEmitter {
  emit<K extends keyof PlatformEventMap>(event: K, ...args: PlatformEventMap[K]): boolean {
    return super.emit(event as string, ...args);
  }

  on<K extends keyof PlatformEventMap>(
    event: K,
    listener: (...args: PlatformEventMap[K]) => void,
  ): this {
    return super.on(event as string, listener as (...args: unknown[]) => void);
  }
}

export const platformEventEmitter = new PlatformEventEmitter();
