/**
 * Unit Tests — Utilities
 * PRD-06: Section 12 — Testing (Unit)
 */

import { describe, it, expect } from 'vitest';
import { sanitizeUser, stripNulls } from '../../helpers/sanitize';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../../utils/jwt';
import { Role } from '@prisma/client';

// ── Sanitize helpers ──────────────────────────────────────────────────────────
describe('sanitizeUser', () => {
  it('removes passwordHash from user object', () => {
    const user = { id: '1', email: 'a@b.com', fullName: 'Test', passwordHash: 'secret' };
    const result = sanitizeUser(user);
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.email).toBe('a@b.com');
  });

  it('keeps all other fields intact', () => {
    const user = { id: '1', email: 'a@b.com', fullName: 'Test', role: 'STUDENT', passwordHash: 'h' };
    const result = sanitizeUser(user);
    expect(result).toMatchObject({ id: '1', email: 'a@b.com', fullName: 'Test', role: 'STUDENT' });
  });
});

describe('stripNulls', () => {
  it('removes null and undefined values', () => {
    const obj = { a: 1, b: null, c: undefined, d: 'hello' };
    const result = stripNulls(obj);
    expect(result).toEqual({ a: 1, d: 'hello' });
  });

  it('preserves falsy but non-null/undefined values', () => {
    const obj = { a: 0, b: false, c: '', d: null };
    const result = stripNulls(obj);
    expect(result).toEqual({ a: 0, b: false, c: '' });
  });
});

// ── JWT utils ──────────────────────────────────────────────────────────────────
describe('JWT utilities', () => {
  const payload = { userId: 'user-123', email: 'test@test.com', role: Role.STUDENT };

  it('generates and verifies an access token', () => {
    const token = generateAccessToken(payload);
    expect(token).toBeTruthy();
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('generates a refresh token', () => {
    const token = generateRefreshToken(payload);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT format
  });

  it('throws on invalid token', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });
});
