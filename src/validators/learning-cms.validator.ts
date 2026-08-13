/**
 * Learning CMS Validators
 *
 * Purpose-built Zod schemas for the Learning CMS write endpoints.
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
  CourseStatus,
  LearningProgressStatus,
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

// ── Learning CMS: Courses ────────────────────────────────────────────────────

export const createCourseSchema = z.object({
  body: createBody(
    {
      title: reqStr('Title', 300),
      slug: optSlug,
      description: z.string().optional(),
      thumbnail: z.string().max(2000).optional(),
      status: z.nativeEnum(CourseStatus).optional(),
      totalDays: optInt({ min: 0 }),
      startDate: optDate,
      endDate: optDate,
    },
    'title',
  ),
});

export const updateCourseSchema = z.object({
  params: idParams,
  body: updateBody({
    title: z.string().trim().min(1).max(300).optional(),
    slug: optSlug,
    description: z.string().optional(),
    thumbnail: z.string().max(2000).optional(),
    status: z.nativeEnum(CourseStatus).optional(),
    totalDays: optInt({ min: 0 }),
    startDate: optDate,
    endDate: optDate,
  }),
});

export const getCourseByIdSchema = z.object({
  params: idParams,
});

// ── Learning CMS: Levels ─────────────────────────────────────────────────────

export const createLevelSchema = z.object({
  body: z
    .object({
      courseId: z.string({ required_error: 'Course is required' }).uuid('Invalid course'),
      levelNumber: optInt({ min: 0 }),
      title: reqStr('Title', 300),
      description: z.string().optional(),
      order: optInt({ min: 0 }),
      status: z.nativeEnum(CourseStatus).optional(),
      youtubeUrl: z.string().trim().max(2000).url('Must be a valid URL').optional(),
    })
    .passthrough(),
});

export const updateLevelSchema = z.object({
  params: idParams,
  body: updateBody({
    levelNumber: optInt({ min: 0 }),
    title: z.string().trim().min(1).max(300).optional(),
    description: z.string().optional(),
    order: optInt({ min: 0 }),
    status: z.nativeEnum(CourseStatus).optional(),
    youtubeUrl: z.string().trim().max(2000).url('Must be a valid URL').optional(),
  }),
});

export const getLevelsByCourseSchema = z.object({
  params: z.object({
    courseId: z.string({ required_error: 'Course ID is required' }).uuid('Invalid course ID'),
  }),
});

export const reorderLevelsSchema = z.object({
  body: z.object({
    orders: z.array(
      z.object({
      id: z.string().uuid('Invalid level ID'),
      order: z.coerce.number().int().min(0, 'Order must be at least 0'),
    }),
    ).min(1, 'At least one order entry is required'),
  }),
});

// ── Learning CMS: LearningContent ──────────────────────────────────────────

export const createContentSchema = z.object({
  body: createBody(
    {
      courseId: z.string({ required_error: 'Course is required' }).uuid('Invalid course'),
      levelId: z.string({ required_error: 'Level is required' }).uuid('Invalid level'),
      dayNumber: optInt({ min: 1 }),
      topicName: reqStr('Topic name', 500),
      slug: optSlug,
      description: z.string().optional(),
      reelUrl: z.string().trim().max(2000).url('Must be a valid URL').optional(),
      youtubeUrl: z.string().trim().max(2000).url('Must be a valid URL').optional(),
      published: optBool,
      order: optInt({ min: 0 }),
    },
    'topicName',
  ),
});

export const updateContentSchema = z.object({
  params: idParams,
  body: updateBody({
    levelId: z.string().uuid('Invalid level').optional(),
    dayNumber: optInt({ min: 1 }),
    topicName: z.string().trim().min(1).max(500).optional(),
    slug: optSlug,
    description: z.string().optional(),
    reelUrl: z.string().trim().max(2000).url('Must be a valid URL').optional(),
    youtubeUrl: z.string().trim().max(2000).url('Must be a valid URL').optional(),
    published: optBool,
    order: optInt({ min: 0 }),
  }),
});

export const getContentByIdSchema = z.object({
  params: idParams,
});

export const listContentSchema = z.object({
  query: z.object({
    courseId: z.preprocess(emptyToUndef, z.string().uuid('Invalid course ID').optional()),
    levelId: z.preprocess(emptyToUndef, z.string().uuid('Invalid level ID').optional()),
    published: optBool,
    page: optInt({ min: 1 }),
    limit: optInt({ min: 1 }),
  }),
});

export const publishContentSchema = z.object({
  params: idParams,
});

export const reorderContentSchema = z.object({
  body: z.object({
    orders: z.array(
      z.object({
      id: z.string().uuid('Invalid content ID'),
      order: z.coerce.number().int().min(0, 'Order must be at least 0'),
    }),
    ).min(1, 'At least one order entry is required'),
  }),
});

// ── Learning CMS: LearningNotes ────────────────────────────────────────────

export const uploadNoteSchema = z.object({
  params: idParams,
  body: updateBody({
    noteOrder: optInt({ min: 0 }),
  }),
});

export const deleteNoteSchema = z.object({
  params: z.object({
    noteId: z.string({ required_error: 'Note ID is required' }).uuid('Invalid note ID'),
  }),
});

export const getNotesSchema = z.object({
  params: idParams,
});

// ── Learning CMS: Bulk Operations ────────────────────────────────────────────

export const bulkStatusSchema = z.object({
  body: z.object({
    ids: z
      .array(z.string().uuid('Invalid content ID'))
      .min(1, 'At least one ID is required'),
    status: z.enum(['PUBLISHED', 'DRAFT', 'ARCHIVED'], {
      required_error: 'status is required',
      invalid_type_error: 'status must be PUBLISHED, DRAFT, or ARCHIVED',
    }),
  }),
});

export const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z
      .array(z.string().uuid('Invalid content ID'))
      .min(1, 'At least one ID is required'),
  }),
});

// ── Learning CMS: Progress ───────────────────────────────────────────────────

export const updateProgressSchema = z.object({
  params: idParams,
  body: updateBody({
    status: z.nativeEnum(LearningProgressStatus).optional(),
    lastAccessedAt: optDate,
  }),
});
