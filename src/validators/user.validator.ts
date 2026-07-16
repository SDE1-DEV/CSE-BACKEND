import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
      .trim()
      .optional(),
    phoneNumber: z
      .string()
      .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
      .optional()
      .nullable(),
    bio: z.string().max(500, 'Bio must not exceed 500 characters').optional().nullable(),
    collegeName: z
      .string()
      .max(200, 'College name must not exceed 200 characters')
      .optional()
      .nullable(),
    university: z
      .string()
      .max(200, 'University name must not exceed 200 characters')
      .optional()
      .nullable(),
    branch: z.string().max(100, 'Branch must not exceed 100 characters').optional().nullable(),
    semester: z
      .number()
      .int('Semester must be an integer')
      .min(1, 'Semester must be between 1 and 8')
      .max(8, 'Semester must be between 1 and 8')
      .optional()
      .nullable(),
    currentYear: z
      .number()
      .int('Year must be an integer')
      .min(1, 'Year must be between 1 and 5')
      .max(5, 'Year must be between 1 and 5')
      .optional()
      .nullable(),
    githubUrl: z
      .string()
      .url('Invalid GitHub URL')
      .regex(/^https?:\/\/(www\.)?github\.com\//, 'Must be a valid GitHub URL')
      .optional()
      .nullable(),
    linkedinUrl: z
      .string()
      .url('Invalid LinkedIn URL')
      .regex(/^https?:\/\/(www\.)?linkedin\.com\//, 'Must be a valid LinkedIn URL')
      .optional()
      .nullable(),
    portfolioUrl: z.string().url('Invalid portfolio URL').optional().nullable(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
