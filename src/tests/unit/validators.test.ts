/**
 * Unit Tests — Validators
 * PRD-06: Section 12 — Testing (Unit)
 */

import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, verifyEmailSchema } from '../../validators/auth.validator';

describe('registerSchema', () => {
  const validBody = {
    fullName: 'John Doe',
    email: 'john@example.com',
    password: 'Password1!',
  };

  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({ body: validBody });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ body: { ...validBody, email: 'not-an-email' } });
    expect(result.success).toBe(false);
  });

  it('rejects weak password', () => {
    const result = registerSchema.safeParse({ body: { ...validBody, password: 'password' } });
    expect(result.success).toBe(false);
  });

  it('rejects short fullName', () => {
    const result = registerSchema.safeParse({ body: { ...validBody, fullName: 'A' } });
    expect(result.success).toBe(false);
  });

  it('requires fullName', () => {
    const { fullName: _fullName, ...withoutName } = validBody;
    const result = registerSchema.safeParse({ body: withoutName });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid login credentials', () => {
    const result = loginSchema.safeParse({
      body: { email: 'user@test.com', password: 'anypassword' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      body: { email: 'user@test.com', password: '' },
    });
    expect(result.success).toBe(false);
  });
});

describe('verifyEmailSchema', () => {
  it('accepts valid OTP', () => {
    const result = verifyEmailSchema.safeParse({
      body: { email: 'user@test.com', otp: '123456' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects OTP that is not 6 digits', () => {
    const result = verifyEmailSchema.safeParse({
      body: { email: 'user@test.com', otp: '12345' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric OTP', () => {
    const result = verifyEmailSchema.safeParse({
      body: { email: 'user@test.com', otp: 'abcdef' },
    });
    expect(result.success).toBe(false);
  });
});
