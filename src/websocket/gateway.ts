/**
 * WebSocket Gateway
 * PRD-06: Section 5 — Real-time communication
 *
 * Supports:
 * - Live notifications
 * - Team activity updates
 * - Invitation updates
 * - Task status updates
 * - Dashboard refresh events
 *
 * Designed to be extended with chat and collaborative editing
 * without architectural changes.
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export type WsEventType =
  | 'notification:new'
  | 'team:activity'
  | 'invitation:update'
  | 'task:update'
  | 'dashboard:refresh'
  | 'connected'
  | 'error';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

class WebSocketGateway {
  private io: SocketIOServer | null = null;

  /**
   * Initialize the gateway with an HTTP server.
   * Call this once during server startup.
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60_000,
      pingInterval: 25_000,
      transports: ['websocket', 'polling'],
    });

    // JWT Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token =
          (socket.handshake.auth as Record<string, string>)['token'] ||
          (socket.handshake.headers['authorization'] ?? '').replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const payload = verifyAccessToken(token);
        socket.userId = payload.userId;
        socket.userEmail = payload.email;
        socket.userRole = payload.role;
        next();
      } catch {
        next(new Error('Invalid or expired token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      logger.info('WebSocket client connected', { userId, socketId: socket.id });

      // Join a personal room for targeted events
      void socket.join(`user:${userId}`);

      socket.emit('connected', { userId, socketId: socket.id });

      // Join team rooms
      socket.on('team:join', (teamId: string) => {
        void socket.join(`team:${teamId}`);
        logger.debug('Client joined team room', { userId, teamId });
      });

      socket.on('team:leave', (teamId: string) => {
        void socket.leave(`team:${teamId}`);
      });

      socket.on('disconnect', (reason) => {
        logger.info('WebSocket client disconnected', { userId, socketId: socket.id, reason });
      });

      socket.on('error', (err) => {
        logger.error('WebSocket error', { userId, error: err.message });
      });
    });

    logger.info('WebSocket gateway initialized');
  }

  /**
   * Emit an event to a specific user (via their personal room).
   */
  emitToUser(userId: string, event: WsEventType, data: unknown): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit an event to all members of a team room.
   */
  emitToTeam(teamId: string, event: WsEventType, data: unknown): void {
    if (!this.io) return;
    this.io.to(`team:${teamId}`).emit(event, data);
  }

  /**
   * Broadcast to all connected clients.
   */
  broadcast(event: WsEventType, data: unknown): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  /**
   * Get count of connected sockets.
   */
  getConnectedCount(): number {
    if (!this.io) return 0;
    return this.io.engine.clientsCount;
  }

  getServer(): SocketIOServer | null {
    return this.io;
  }
}

// Singleton instance
export const wsGateway = new WebSocketGateway();
