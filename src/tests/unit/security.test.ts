/**
 * Unit Tests — Security Middleware
 * PRD-06: Section 12 + Section 13
 */

import { describe, it, expect, vi } from 'vitest';
import { sanitizeInput } from '../../middlewares/security.middleware';
import type { Request, Response, NextFunction } from 'express';

const mockReq = (body: unknown = {}, query: unknown = {}, params: unknown = {}) =>
  ({ body, query, params } as unknown as Request);

const mockRes = {} as Response;
const mockNext: NextFunction = vi.fn();

describe('sanitizeInput middleware', () => {
  it('strips XSS from body strings', () => {
    const req = mockReq({ name: '<script>alert("xss")</script>Hello' });
    sanitizeInput(req, mockRes, mockNext);
    expect((req.body as { name: string }).name).not.toContain('<script>');
    expect((req.body as { name: string }).name).toContain('Hello');
    expect(mockNext).toHaveBeenCalled();
  });

  it('sanitizes nested objects', () => {
    const req = mockReq({ user: { bio: '<img src=x onerror=alert(1)>Clean' } });
    sanitizeInput(req, mockRes, mockNext);
    expect((req.body as { user: { bio: string } }).user.bio).not.toContain('onerror');
    expect((req.body as { user: { bio: string } }).user.bio).toContain('Clean');
  });

  it('handles non-string values safely', () => {
    const req = mockReq({ count: 42, active: true, data: null });
    sanitizeInput(req, mockRes, mockNext);
    expect((req.body as { count: number }).count).toBe(42);
    expect((req.body as { active: boolean }).active).toBe(true);
    expect((req.body as { data: null }).data).toBeNull();
  });

  it('calls next() after sanitizing', () => {
    const req = mockReq({ text: 'safe text' });
    sanitizeInput(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledOnce();
  });
});
