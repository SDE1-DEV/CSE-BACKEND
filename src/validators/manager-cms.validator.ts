/**
 * FPRD-11: Manager CMS Validators
 *
 * Purpose-built Zod schemas for the Manager Console write endpoints.
 *
 * These differ from the public PRD validators because the CMS forms submit data
 * as HTML form values, which means:
 *   - number inputs arrive as strings ("1000")  → coerce to number
 *   - untouched optional fields arrive as ""      → strip (treat as unset)
 *   - datetime-local inputs arrive as strings     → coerce to Date
 *   - a blank slug should be derived from the title/name, not rejected
 *
 * Used together with `validateAndSanitize`, so the cleaned/coerced body is
 * written back onto the request before it reaches the controller/service.
 */

import { z } from 'zod';
import {
  Difficulty,
  ContentType,
  ResourceType,
  ProblemDifficulty,
  ProjectDifficulty,
  JobType,
  WorkMode,
  EventType,
  BannerPlacement,
  BannerType,
  MediaFileType,
} from '@prisma/client';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Treat empty strings / null as "not provided". */
const emptyToUndef = (v: unknown) => (v === '' || v === null ? undefined : v);

/** Optional integer that tolerates form strings ("40") and blanks (""). */
const optInt = (opts?: { min?: number; max?: number }) => {
  let n = z.coerce.number({ invalid_type_error: 'Must be a number' }).int('Must be a whole number');
  if (opts?.min !== undefined) n = n.min(opts.min, `Must be at least ${opts.min}`);
  if (opts?.max !== undefined) n = n.max(opts.max, `Must be at most ${opts.max}`);
  return z.preprocess(emptyToUndef, n.optional());
};

/** Optional boolean from a checkbox/switch. */
const optBool = z.preprocess(emptyToUndef, z.coerce.boolean().optional());

/** Optional Date from a datetime-local string. */
const optDate = z.preprocess(
  emptyToUndef,
  z.coerce.date({ invalid_type_error: 'Invalid date' }).optional(),
);
const reqDate = z.preprocess(
  emptyToUndef,
  z.coerce.date({ required_error: 'Date is required', invalid_type_error: 'Invalid date' }),
);

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Optional slug — validated only when a non-empty value is supplied. */
const optSlug = z.preprocess(
  emptyToUndef,
  z
    .string()
    .max(300)
    .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens only')
    .optional(),
);

const reqStr = (label: string, max = 500) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max);

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 300);
}

/**
 * Wrap a create-body shape:
 *   - passes through unknown fields (so we never drop data the form sends)
 *   - strips empty-string / undefined values (Prisma then uses defaults)
 *   - derives `slug` from the given title field when blank
 */
function createBody(shape: z.ZodRawShape, titleKey: string) {
  return z
    .object(shape)
    .passthrough()
    .transform((data: Record<string, unknown>) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v === '' || v === null || v === undefined) continue;
        out[k] = v;
      }
      if (!out['slug'] && typeof out[titleKey] === 'string') {
        out['slug'] = slugify(out[titleKey] as string);
      }
      return out;
    });
}

/** Wrap an update-body shape: strip empties, keep everything else. */
function updateBody(shape: z.ZodRawShape) {
  return z
    .object(shape)
    .passthrough()
    .transform((data: Record<string, unknown>) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v === '' || v === null || v === undefined) continue;
        out[k] = v;
      }
      return out;
    });
}

const idParams = z.object({
  id: z.string({ required_error: 'ID is required' }).uuid('Invalid ID format'),
});

// ── Learning: Categories ──────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  body: createBody(
    {
      title: reqStr('Title', 300),
      slug: optSlug,
      description: z.string().max(2000).optional(),
      icon: z.string().max(500).optional(),
      displayOrder: optInt({ min: 0 }),
      isActive: optBool,
    },
    'title',
  ),
});

export const updateCategorySchema = z.object({
  params: idParams,
  body: updateBody({
    title: z.string().trim().min(1).max(300).optional(),
    slug: optSlug,
    description: z.string().max(2000).optional(),
    icon: z.string().max(500).optional(),
    displayOrder: optInt({ min: 0 }),
    isActive: optBool,
  }),
});

// ── Learning: Roadmaps ────────────────────────────────────────────────────────

export const createRoadmapSchema = z.object({
  body: createBody(
    {
      categoryId: z.string({ required_error: 'Category is required' }).uuid('Invalid category'),
      title: reqStr('Title', 300),
      slug: optSlug,
      difficulty: z.nativeEnum(Difficulty).optional(),
      estimatedHours: optInt({ min: 1 }),
    },
    'title',
  ),
});

export const updateRoadmapSchema = z.object({
  params: idParams,
  body: updateBody({
    categoryId: z.string().uuid('Invalid category').optional(),
    title: z.string().trim().min(1).max(300).optional(),
    slug: optSlug,
    difficulty: z.nativeEnum(Difficulty).optional(),
    estimatedHours: optInt({ min: 1 }),
    isPublished: optBool,
  }),
});

// ── Learning: Sections ────────────────────────────────────────────────────────

export const createSectionSchema = z.object({
  body: z
    .object({
      roadmapId: z.string({ required_error: 'Roadmap is required' }).uuid('Invalid roadmap'),
      title: reqStr('Title', 300),
      description: z.string().max(2000).optional(),
      order: optInt({ min: 0 }),
    })
    .passthrough(),
});

export const updateSectionSchema = z.object({
  params: idParams,
  body: updateBody({
    title: z.string().trim().min(1).max(300).optional(),
    description: z.string().max(2000).optional(),
    order: optInt({ min: 0 }),
  }),
});

// ── Learning: Lessons ─────────────────────────────────────────────────────────

export const createLessonSchema = z.object({
  body: createBody(
    {
      sectionId: z.string({ required_error: 'Section is required' }).uuid('Invalid section'),
      title: reqStr('Title', 300),
      slug: optSlug,
      contentType: z.nativeEnum(ContentType).optional(),
      estimatedMinutes: optInt({ min: 0 }),
      order: optInt({ min: 0 }),
      isPublished: optBool,
    },
    'title',
  ),
});

export const updateLessonSchema = z.object({
  params: idParams,
  body: updateBody({
    sectionId: z.string().uuid('Invalid section').optional(),
    title: z.string().trim().min(1).max(300).optional(),
    slug: optSlug,
    contentType: z.nativeEnum(ContentType).optional(),
    estimatedMinutes: optInt({ min: 0 }),
    order: optInt({ min: 0 }),
    isPublished: optBool,
  }),
});

// ── Learning: Resources ───────────────────────────────────────────────────────

export const createResourceSchema = z.object({
  body: z
    .object({
      lessonId: z.string({ required_error: 'Lesson is required' }).uuid('Invalid lesson'),
      title: reqStr('Title', 300),
      type: z.nativeEnum(ResourceType, { required_error: 'Type is required' }),
      url: z
        .string({ required_error: 'URL is required' })
        .trim()
        .min(1, 'URL is required')
        .max(2000),
      author: z.string().max(200).optional(),
      duration: optInt({ min: 0 }),
    })
    .passthrough(),
});

export const updateResourceSchema = z.object({
  params: idParams,
  body: updateBody({
    title: z.string().trim().min(1).max(300).optional(),
    type: z.nativeEnum(ResourceType).optional(),
    url: z.string().trim().min(1).max(2000).optional(),
    author: z.string().max(200).optional(),
    duration: optInt({ min: 0 }),
  }),
});

// ── Coding: Problem Categories ────────────────────────────────────────────────

export const createProblemCategorySchema = z.object({
  body: createBody(
    {
      name: reqStr('Name', 200),
      slug: optSlug,
      description: z.string().max(2000).optional(),
      displayOrder: optInt({ min: 0 }),
      isActive: optBool,
    },
    'name',
  ),
});

export const updateProblemCategorySchema = z.object({
  params: idParams,
  body: updateBody({
    name: z.string().trim().min(1).max(200).optional(),
    slug: optSlug,
    description: z.string().max(2000).optional(),
    displayOrder: optInt({ min: 0 }),
    isActive: optBool,
  }),
});

// ── Coding: Problems ──────────────────────────────────────────────────────────

export const createProblemSchema = z.object({
  body: createBody(
    {
      categoryId: z.string({ required_error: 'Category is required' }).uuid('Invalid category'),
      title: reqStr('Title', 500),
      slug: optSlug,
      difficulty: z.nativeEnum(ProblemDifficulty).optional(),
      problemStatement: reqStr('Problem statement', 20000),
      timeLimit: optInt({ min: 100, max: 10000 }),
      memoryLimit: optInt({ min: 16, max: 1024 }),
      points: optInt({ min: 0 }),
    },
    'title',
  ),
});

export const updateProblemSchema = z.object({
  params: idParams,
  body: updateBody({
    categoryId: z.string().uuid('Invalid category').optional(),
    title: z.string().trim().min(1).max(500).optional(),
    slug: optSlug,
    difficulty: z.nativeEnum(ProblemDifficulty).optional(),
    problemStatement: z.string().trim().min(1).max(20000).optional(),
    timeLimit: optInt({ min: 100, max: 10000 }),
    memoryLimit: optInt({ min: 16, max: 1024 }),
    points: optInt({ min: 0 }),
    isPublished: optBool,
  }),
});

// ── Projects: Categories ──────────────────────────────────────────────────────

export const createProjectCategorySchema = z.object({
  body: createBody(
    {
      name: reqStr('Name', 200),
      slug: optSlug,
      description: z.string().max(2000).optional(),
      icon: z.string().max(500).optional(),
      displayOrder: optInt({ min: 0 }),
      isActive: optBool,
    },
    'name',
  ),
});

export const updateProjectCategorySchema = z.object({
  params: idParams,
  body: updateBody({
    name: z.string().trim().min(1).max(200).optional(),
    slug: optSlug,
    description: z.string().max(2000).optional(),
    icon: z.string().max(500).optional(),
    displayOrder: optInt({ min: 0 }),
    isActive: optBool,
  }),
});

// ── Projects ──────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  body: createBody(
    {
      categoryId: z.string({ required_error: 'Category is required' }).uuid('Invalid category'),
      title: reqStr('Title', 300),
      slug: optSlug,
      difficulty: z.nativeEnum(ProjectDifficulty).optional(),
      isPublished: optBool,
    },
    'title',
  ),
});

export const updateProjectSchema = z.object({
  params: idParams,
  body: updateBody({
    categoryId: z.string().uuid('Invalid category').optional(),
    title: z.string().trim().min(1).max(300).optional(),
    slug: optSlug,
    difficulty: z.nativeEnum(ProjectDifficulty).optional(),
    isPublished: optBool,
  }),
});

// ── Placements: Companies ─────────────────────────────────────────────────────

export const createCompanySchema = z.object({
  body: createBody(
    {
      name: reqStr('Name', 200),
      slug: optSlug,
      industry: z.string().max(200).optional(),
      verified: optBool,
    },
    'name',
  ),
});

export const updateCompanySchema = z.object({
  params: idParams,
  body: updateBody({
    name: z.string().trim().min(1).max(200).optional(),
    slug: optSlug,
    industry: z.string().max(200).optional(),
    verified: optBool,
  }),
});

// ── Placements: Jobs ──────────────────────────────────────────────────────────

export const createJobSchema = z.object({
  body: z
    .object({
      companyId: z.string({ required_error: 'Company is required' }).uuid('Invalid company'),
      title: reqStr('Title', 300),
      type: z.nativeEnum(JobType, { required_error: 'Type is required' }),
      workMode: z.nativeEnum(WorkMode).optional(),
      description: reqStr('Description', 20000),
      applicationDeadline: optDate,
      isPublished: optBool,
    })
    .passthrough(),
});

export const updateJobSchema = z.object({
  params: idParams,
  body: updateBody({
    companyId: z.string().uuid('Invalid company').optional(),
    title: z.string().trim().min(1).max(300).optional(),
    type: z.nativeEnum(JobType).optional(),
    workMode: z.nativeEnum(WorkMode).optional(),
    description: z.string().trim().min(1).max(20000).optional(),
    applicationDeadline: optDate,
    isPublished: optBool,
  }),
});

// ── Events ────────────────────────────────────────────────────────────────────

export const createEventSchema = z.object({
  body: z
    .object({
      title: reqStr('Title', 300),
      type: z.nativeEnum(EventType, { required_error: 'Type is required' }),
      startTime: reqDate,
      endTime: reqDate,
      maxParticipants: optInt({ min: 1 }),
      isPublished: optBool,
    })
    .passthrough()
    .refine((d) => (d.endTime as Date) >= (d.startTime as Date), {
      message: 'End time must be after start time',
      path: ['endTime'],
    }),
});

export const updateEventSchema = z.object({
  params: idParams,
  body: updateBody({
    title: z.string().trim().min(1).max(300).optional(),
    type: z.nativeEnum(EventType).optional(),
    startTime: optDate,
    endTime: optDate,
    maxParticipants: optInt({ min: 1 }),
    isPublished: optBool,
  }),
});

// ── Banners ───────────────────────────────────────────────────────────────────

export const createBannerSchema = z.object({
  body: z
    .object({
      title: reqStr('Title', 300),
      mediaUrl: z.string().trim().min(1).max(2000).optional(),
      placement: z.nativeEnum(BannerPlacement, { required_error: 'Placement is required' }),
      type: z.nativeEnum(BannerType).optional(),
      ctaText: z.string().trim().max(200).optional(),
      ctaLink: z.string().trim().max(2000).optional(),
      priority: optInt({ min: 0, max: 100 }),
      isActive: optBool,
      scheduledAt: optDate,
      expiresAt: optDate,
    })
    .passthrough(),
});

export const updateBannerSchema = z.object({
  params: idParams,
  body: updateBody({
    title: z.string().trim().min(1).max(300).optional(),
    mediaUrl: z.string().trim().min(1).max(2000).optional(),
    placement: z.nativeEnum(BannerPlacement).optional(),
    type: z.nativeEnum(BannerType).optional(),
    ctaText: z.string().trim().max(200).optional(),
    ctaLink: z.string().trim().max(2000).optional(),
    priority: optInt({ min: 0, max: 100 }),
    isActive: optBool,
    scheduledAt: optDate,
    expiresAt: optDate,
  }),
});

// ── FAQ Categories ────────────────────────────────────────────────────────────

export const createFaqCategorySchema = z.object({
  body: createBody(
    {
      name: reqStr('Name', 200),
      slug: optSlug,
      displayOrder: optInt({ min: 0 }),
      isActive: optBool,
    },
    'name',
  ),
});

export const updateFaqCategorySchema = z.object({
  params: idParams,
  body: updateBody({
    name: z.string().trim().min(1).max(200).optional(),
    slug: optSlug,
    displayOrder: optInt({ min: 0 }),
    isActive: optBool,
  }),
});

// ── FAQs ──────────────────────────────────────────────────────────────────────

export const createFaqSchema = z.object({
  body: z
    .object({
      question: reqStr('Question', 1000),
      answer: reqStr('Answer', 20000),
      categoryId: z.string().uuid('Invalid category ID').optional(),
      searchKeywords: z.string().max(1000).optional(),
      displayOrder: optInt({ min: 0 }),
      isPublished: optBool,
    })
    .passthrough(),
});

export const updateFaqSchema = z.object({
  params: idParams,
  body: updateBody({
    question: z.string().trim().min(1).max(1000).optional(),
    answer: z.string().trim().min(1).max(20000).optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    searchKeywords: z.string().max(1000).optional(),
    displayOrder: optInt({ min: 0 }),
    isPublished: optBool,
  }),
});

// ── Testimonials ──────────────────────────────────────────────────────────────

export const createTestimonialSchema = z.object({
  body: z
    .object({
      studentName: reqStr('Student name', 200),
      content: reqStr('Content', 5000),
      studentId: z.string().uuid('Invalid student ID').optional(),
      role: z.string().trim().max(200).optional(),
      company: z.string().trim().max(200).optional(),
      rating: optInt({ min: 1, max: 5 }),
      avatarUrl: z.string().trim().max(2000).optional(),
      isFeatured: optBool,
      isPublished: optBool,
    })
    .passthrough(),
});

export const updateTestimonialSchema = z.object({
  params: idParams,
  body: updateBody({
    studentName: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(5000).optional(),
    studentId: z.string().uuid('Invalid student ID').optional(),
    role: z.string().trim().max(200).optional(),
    company: z.string().trim().max(200).optional(),
    rating: optInt({ min: 1, max: 5 }),
    avatarUrl: z.string().trim().max(2000).optional(),
    isFeatured: optBool,
    isPublished: optBool,
  }),
});

// ── Media Library ─────────────────────────────────────────────────────────────

export const createMediaFileSchema = z.object({
  body: z
    .object({
      filename: reqStr('Filename', 500),
      originalName: z.string().trim().min(1).max(500).optional(),
      mimeType: z.string().trim().min(1).max(200).optional(),
      fileUrl: reqStr('File URL', 2000),
      fileType: z.nativeEnum(MediaFileType).optional(),
      fileSize: optInt({ min: 0 }),
      folder: z.string().trim().max(200).optional(),
      altText: z.string().trim().max(500).optional(),
    })
    .passthrough(),
});

export const updateMediaFileSchema = z.object({
  params: idParams,
  body: updateBody({
    filename: z.string().trim().min(1).max(500).optional(),
    originalName: z.string().trim().min(1).max(500).optional(),
    mimeType: z.string().trim().min(1).max(200).optional(),
    fileUrl: z.string().trim().min(1).max(2000).optional(),
    fileType: z.nativeEnum(MediaFileType).optional(),
    fileSize: optInt({ min: 0 }),
    folder: z.string().trim().max(200).optional(),
    altText: z.string().trim().max(500).optional(),
  }),
});

// ── Notifications (update) ────────────────────────────────────────────────────

export const updateNotificationSchema = z.object({
  params: idParams,
  body: updateBody({
    title: z.string().trim().min(1).max(200).optional(),
    message: z.string().trim().min(1).max(1000).optional(),
    type: z.enum(['PLACEMENT', 'PROJECT', 'CODING', 'LEARNING', 'EVENT', 'SYSTEM']).optional(),
    isRead: optBool,
  }),
});
