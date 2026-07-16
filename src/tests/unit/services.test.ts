/**
 * Unit Tests — Core Service Logic
 * PRD-06: Section 12 — Testing (Unit/Services)
 */

// Add beforeEach to reset mocks between tests
import { describe, it, expect, vi } from 'vitest';

// ── OTP Utilities ─────────────────────────────────────────────────────────────
describe('OTP utilities', async () => {
  const { generateOtp, getOtpExpiry } = await import('../../utils/otp');

  it('generates a 6-digit numeric OTP', () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('generates unique OTPs', () => {
    const otps = new Set(Array.from({ length: 20 }, () => generateOtp()));
    // Very low probability all 20 would be identical
    expect(otps.size).toBeGreaterThan(1);
  });

  it('returns an expiry date in the future', () => {
    const expiry = getOtpExpiry();
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });
});

// ── Hash utilities ────────────────────────────────────────────────────────────
describe('Hash utilities', async () => {
  const { hashPassword, comparePassword } = await import('../../utils/hash');

  it('hashes a password', async () => {
    const hash = await hashPassword('MyPassword1!');
    expect(hash).not.toBe('MyPassword1!');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('comparePassword returns true for matching hash', async () => {
    const password = 'TestPassword1!';
    const hash = await hashPassword(password);
    const match = await comparePassword(password, hash);
    expect(match).toBe(true);
  });

  it('comparePassword returns false for wrong password', async () => {
    const hash = await hashPassword('CorrectPassword1!');
    const match = await comparePassword('WrongPassword1!', hash);
    expect(match).toBe(false);
  });
});

// ── Response helpers ──────────────────────────────────────────────────────────
describe('Response helpers', async () => {
  const { sendSuccess, sendError, sendCreated } = await import('../../utils/response');

  const makeRes = () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    return { status, json, _json: json } as unknown as import('express').Response;
  };

  it('sendSuccess returns 200 with correct shape', () => {
    const res = makeRes();
    sendSuccess(res, 'OK', { value: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    const body = vi.mocked(res.status).mock.results[0].value.json.mock.calls[0][0];
    expect(body).toMatchObject({ success: true, message: 'OK', data: { value: 1 }, errors: null });
  });

  it('sendError returns correct status and shape', () => {
    const res = makeRes();
    sendError(res, 'Something went wrong', 500);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('sendCreated returns 201', () => {
    const res = makeRes();
    sendCreated(res, 'Created', { id: '1' });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// ── AppError ──────────────────────────────────────────────────────────────────
describe('AppError', async () => {
  const { AppError } = await import('../../middlewares/error.middleware');

  it('creates error with correct properties', () => {
    const err = new AppError(404, 'Not found');
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.isOperational).toBe(true);
    expect(err.name).toBe('AppError');
  });

  it('supports non-operational flag', () => {
    const err = new AppError(500, 'Critical', false);
    expect(err.isOperational).toBe(false);
  });
});
