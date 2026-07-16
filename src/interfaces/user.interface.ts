import { Role } from '@prisma/client';

export interface IUserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  profileImage: string | null;
  bio: string | null;
  role: Role;
  isVerified: boolean;
  profileCompletion: number;
  collegeName: string | null;
  university: string | null;
  branch: string | null;
  currentYear: number | null;
  semester: number | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUpdateProfileDto {
  fullName?: string;
  phoneNumber?: string;
  bio?: string;
  collegeName?: string;
  university?: string;
  branch?: string;
  semester?: number;
  currentYear?: number;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
}

export interface IRegisterDto {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface ILoginDto {
  email: string;
  password: string;
}

export interface IVerifyEmailDto {
  email: string;
  otp: string;
}

export interface IForgotPasswordDto {
  email: string;
}

export interface IResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
}

export interface IRefreshTokenDto {
  refreshToken: string;
}
