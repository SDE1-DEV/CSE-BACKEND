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
  // FPRD-23: new profile fields
  username: string | null;
  headline: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  leetcodeUrl: string | null;
  codechefUrl: string | null;
  hackerrankUrl: string | null;
  codeforcesUrl: string | null;
  gfgUrl: string | null;
  mediumUrl: string | null;
  resumeUrl: string | null;
  profileVisibility: string | null;
  lastSeen: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPublicProfile {
  username: string | null;
  fullName: string;
  headline: string | null;
  bio: string | null;
  profileImage: string | null;
  isVerified: boolean;
  branch: string | null;
  collegeName: string | null;
  currentYear: number | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  leetcodeUrl: string | null;
  codechefUrl: string | null;
  hackerrankUrl: string | null;
  codeforcesUrl: string | null;
  gfgUrl: string | null;
  mediumUrl: string | null;
  profileVisibility: string | null;
  createdAt: Date;
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
  // FPRD-23: new fields
  username?: string;
  headline?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  leetcodeUrl?: string;
  codechefUrl?: string;
  hackerrankUrl?: string;
  codeforcesUrl?: string;
  gfgUrl?: string;
  mediumUrl?: string;
  profileVisibility?: string;
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
