import { User } from '@prisma/client';

/**
 * FPRD-23 Part 7: Profile Completion Engine
 * Each field contributes 10%. Total = 100%
 * Fields: avatar(10), bio(10), college(10), branch(10), phone(10),
 *         resume(10), github(10), linkedin(10), portfolio(10), skills/headline(10)
 */

interface ProfileCompletionField {
  field: keyof User;
  weight: number;
  label: string;
}

const PROFILE_COMPLETION_FIELDS: ProfileCompletionField[] = [
  { field: 'profileImage', weight: 10, label: 'Avatar' },
  { field: 'bio', weight: 10, label: 'Bio' },
  { field: 'collegeName', weight: 10, label: 'College' },
  { field: 'branch', weight: 10, label: 'Branch' },
  { field: 'phoneNumber', weight: 10, label: 'Phone' },
  { field: 'resumeUrl', weight: 10, label: 'Resume' },
  { field: 'githubUrl', weight: 10, label: 'GitHub' },
  { field: 'linkedinUrl', weight: 10, label: 'LinkedIn' },
  { field: 'portfolioUrl', weight: 10, label: 'Portfolio' },
  { field: 'headline', weight: 10, label: 'Skills / Headline' },
];

export const calculateProfileCompletion = (user: Partial<User>): number => {
  const total = PROFILE_COMPLETION_FIELDS.reduce((sum, f) => sum + f.weight, 0);
  const earned = PROFILE_COMPLETION_FIELDS.reduce((sum, f) => {
    const value = user[f.field];
    const filled = value !== null && value !== undefined && value !== '';
    return filled ? sum + f.weight : sum;
  }, 0);
  return Math.min(100, Math.round((earned / total) * 100));
};

export const getCompletionDetails = (user: Partial<User>) => {
  return PROFILE_COMPLETION_FIELDS.map((f) => {
    const value = user[f.field];
    const filled = value !== null && value !== undefined && value !== '';
    return { label: f.label, filled, weight: f.weight };
  });
};
