import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    fullName: z
      .string({ required_error: 'Full name is required' })
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
      .trim(),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      ),
    phoneNumber: z
      .string()
      .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
      .optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    otp: z
      .string({ required_error: 'OTP is required' })
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only digits'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    otp: z
      .string({ required_error: 'OTP is required' })
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only digits'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      ),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    // PRD-08: refreshToken is optional in body — backend also reads from httpOnly cookie
    refreshToken: z.string().min(1).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({ required_error: 'Current password is required' }).min(1),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      ),
  }),
});

export const updateAuthProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(100).trim().optional(),
    phoneNumber: z
      .string()
      .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
      .optional(),
    bio: z.string().max(500).optional(),
    collegeName: z.string().max(200).optional(),
    branch: z.string().max(100).optional(),
    currentYear: z.number().int().min(1).max(6).optional(),
    githubUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    portfolioUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateAuthProfileSchema>['body'];
