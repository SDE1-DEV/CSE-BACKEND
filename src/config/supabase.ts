import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import { logger } from '../utils/logger';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ── Bucket name constants ─────────────────────────────────────────────────────
// These are the single source of truth for all bucket names.
// Override via SUPABASE_STORAGE_AVATAR_BUCKET / SUPABASE_STORAGE_RESUME_BUCKET env vars.

/** Bucket for user avatar / profile-image uploads. */
export const AVATAR_BUCKET: string = process.env['SUPABASE_STORAGE_AVATAR_BUCKET'] ?? 'avatars';

/** @deprecated Use AVATAR_BUCKET. Kept for any legacy references. */
export const STORAGE_BUCKET: string = AVATAR_BUCKET;

/** Bucket for resume file uploads. */
export const RESUME_BUCKET: string = process.env['SUPABASE_STORAGE_RESUME_BUCKET'] ?? 'resumes';

/** Bucket for the manager CMS media library (images, video, docs). */
export const MEDIA_BUCKET = 'cms-media';

/** Bucket for learning note image uploads. */
export const LEARNING_NOTES_BUCKET: string =
  process.env['SUPABASE_STORAGE_LEARNING_NOTES_BUCKET'] ?? 'learning-notes';

/** Bucket for admin-uploaded course PDFs. */
export const COURSE_PDFS_BUCKET: string =
  process.env['SUPABASE_STORAGE_COURSE_PDFS_BUCKET'] ?? 'course-pdfs';

// ── Startup bucket validation & auto-creation ─────────────────────────────────

interface BucketSpec {
  name: string;
  public: boolean;
}

const REQUIRED_BUCKETS: BucketSpec[] = [
  { name: AVATAR_BUCKET, public: true },
  { name: RESUME_BUCKET, public: true },
  { name: LEARNING_NOTES_BUCKET, public: true },
  { name: COURSE_PDFS_BUCKET, public: true },
];

/**
 * Validates that the required Supabase storage buckets exist.
 * In development, missing buckets are created automatically.
 * In production, missing buckets only produce a warning log — the server
 * continues so that other features are not blocked.
 *
 * Call this once during server startup.
 */
export const validateStorageBuckets = async (): Promise<void> => {
  const isDev = process.env['NODE_ENV'] !== 'production';

  for (const spec of REQUIRED_BUCKETS) {
    try {
      // Check existence by listing the bucket (lightweight HEAD-equivalent)
      const { data: buckets, error: listErr } = await supabase.storage.listBuckets();

      if (listErr) {
        logger.error(`✗ Supabase storage: could not list buckets — ${listErr.message}`);
        continue;
      }

      const existingBucket = buckets?.find((b) => b.name === spec.name);

      if (existingBucket) {
        // Bucket exists — ensure it has correct public/private setting
        if (existingBucket.public !== spec.public) {
          try {
            await supabase.storage.updateBucket(spec.name, { public: spec.public });
            logger.info(`✓ Bucket '${spec.name}' updated to public=${spec.public}`);
          } catch (updateErr) {
            logger.warn(
              `⚠ Could not update bucket '${spec.name}' visibility: ${(updateErr as Error).message}`,
            );
          }
        } else {
          logger.info(`✓ Bucket '${spec.name}' found (public=${spec.public})`);
        }
        continue;
      }

      // Bucket is missing
      if (isDev) {
        // Auto-create in development
        const { error: createErr } = await supabase.storage.createBucket(spec.name, {
          public: spec.public,
        });

        if (createErr && !/exist/i.test(createErr.message)) {
          logger.error(
            `✗ Bucket '${spec.name}' missing and could not be created: ${createErr.message}`,
          );
        } else {
          logger.info(`✓ Bucket '${spec.name}' was missing — created automatically (development)`);
        }
      } else {
        // Warn in production — don't crash, but make the problem visible
        logger.warn(
          `✗ Bucket '${spec.name}' does not exist in Supabase. ` +
            `Create it manually in the Supabase dashboard (Storage → New bucket → "${spec.name}", ` +
            `public: ${spec.public}).`,
        );
      }
    } catch (err) {
      logger.error(`✗ Unexpected error checking bucket '${spec.name}': ${(err as Error).message}`);
    }
  }
};

/**
 * Validates that the learning notes bucket exists and has correct visibility.
 * In development, creates the bucket automatically if missing.
 * This is a focused helper for runtime checks specific to learning note operations.
 */
export const validateLearningNotesBucket = async (): Promise<void> => {
  const isDev = process.env['NODE_ENV'] !== 'production';
  const spec: BucketSpec = { name: LEARNING_NOTES_BUCKET, public: true };

  try {
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();

    if (listErr) {
      logger.error(`✗ Learning notes bucket: could not list buckets — ${listErr.message}`);
      return;
    }

    const existingBucket = buckets?.find((b) => b.name === spec.name);

    if (existingBucket) {
      if (existingBucket.public !== spec.public) {
        try {
          await supabase.storage.updateBucket(spec.name, { public: spec.public });
          logger.info(`✓ Learning notes bucket updated to public=${spec.public}`);
        } catch (updateErr) {
          logger.warn(
            `⚠ Could not update learning notes bucket visibility: ${(updateErr as Error).message}`,
          );
        }
      }
      return;
    }

    if (isDev) {
      const { error: createErr } = await supabase.storage.createBucket(spec.name, {
        public: spec.public,
      });

      if (createErr && !/exist/i.test(createErr.message)) {
        logger.error(
          `✗ Learning notes bucket missing and could not be created: ${createErr.message}`,
        );
      } else {
        logger.info(`✓ Learning notes bucket was missing — created automatically (development)`);
      }
    } else {
      logger.warn(
        `✗ Learning notes bucket '${spec.name}' does not exist in Supabase. ` +
          `Create it manually in the Supabase dashboard (Storage → New bucket → "${spec.name}", public: ${spec.public}).`,
      );
    }
  } catch (err) {
    logger.error(`✗ Unexpected error validating learning notes bucket: ${(err as Error).message}`);
  }
};
