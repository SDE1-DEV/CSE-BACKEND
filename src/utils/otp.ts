import crypto from 'crypto';
import { OTP_LENGTH, OTP_EXPIRY_MINUTES } from '../constants';

export const generateOtp = (): string => {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(OTP_LENGTH);
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[randomBytes[i]! % digits.length];
  }
  return otp;
};

export const getOtpExpiry = (): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + OTP_EXPIRY_MINUTES);
  return expiry;
};

export const isOtpExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};
