import { User } from '@prisma/client';

const PROFILE_FIELDS: Array<keyof User> = [
  'fullName',
  'phoneNumber',
  'profileImage',
  'bio',
  'collegeName',
  'university',
  'branch',
  'currentYear',
  'semester',
  'githubUrl',
  'linkedinUrl',
  'portfolioUrl',
];

export const calculateProfileCompletion = (user: Partial<User>): number => {
  const filled = PROFILE_FIELDS.filter((field) => {
    const value = user[field];
    return value !== null && value !== undefined && value !== '';
  });
  return Math.round((filled.length / PROFILE_FIELDS.length) * 100);
};
