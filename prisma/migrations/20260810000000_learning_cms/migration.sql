-- ─────────────────────────────────────────────────────────────────────────────
-- Learning CMS Migration
-- Creates: courses, levels, learning_contents, learning_note_images,
--          learning_progress
--
-- This migration is ADDITIVE and safe for production.
-- It does NOT drop, alter, or touch any existing tables.
-- ─────────────────────────────────────────────────────────────────────────────

-- CourseStatus enum (shared by Course and Level)
DO $$ BEGIN
  CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- LearningProgressStatus enum
DO $$ BEGIN
  CREATE TYPE "LearningProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── courses ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "courses" (
    "id"          TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "description" TEXT,
    "thumbnail"   TEXT,
    "status"      "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "totalDays"   INTEGER NOT NULL DEFAULT 0,
    "startDate"   TIMESTAMP(3),
    "endDate"     TIMESTAMP(3),
    "createdBy"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "courses_slug_key" ON "courses"("slug");
CREATE INDEX IF NOT EXISTS "courses_slug_idx"   ON "courses"("slug");
CREATE INDEX IF NOT EXISTS "courses_status_idx" ON "courses"("status");

-- ── levels ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "levels" (
    "id"          TEXT NOT NULL,
    "courseId"    TEXT NOT NULL,
    "levelNumber" INTEGER NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "order"       INTEGER NOT NULL DEFAULT 0,
    "status"      "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "youtubeUrl"  TEXT,
    "createdBy"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "levels_courseId_fkey" FOREIGN KEY ("courseId")
        REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "levels_courseId_levelNumber_key" ON "levels"("courseId", "levelNumber");
CREATE INDEX IF NOT EXISTS "levels_courseId_idx" ON "levels"("courseId");
CREATE INDEX IF NOT EXISTS "levels_order_idx"    ON "levels"("order");

-- ── learning_contents ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "learning_contents" (
    "id"          TEXT NOT NULL,
    "courseId"    TEXT NOT NULL,
    "levelId"     TEXT NOT NULL,
    "dayNumber"   INTEGER NOT NULL,
    "topicName"   TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "description" TEXT,
    "reelUrl"     TEXT,
    "youtubeUrl"  TEXT,
    "published"   BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "order"       INTEGER NOT NULL DEFAULT 0,
    "createdBy"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_contents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "learning_contents_courseId_fkey" FOREIGN KEY ("courseId")
        REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "learning_contents_levelId_fkey" FOREIGN KEY ("levelId")
        REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "learning_contents_slug_key"              ON "learning_contents"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "learning_contents_courseId_dayNumber_key" ON "learning_contents"("courseId", "dayNumber");
CREATE INDEX IF NOT EXISTS "learning_contents_levelId_idx"   ON "learning_contents"("levelId");
CREATE INDEX IF NOT EXISTS "learning_contents_published_idx" ON "learning_contents"("published");
CREATE INDEX IF NOT EXISTS "learning_contents_order_idx"     ON "learning_contents"("order");

-- ── learning_note_images ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "learning_note_images" (
    "id"                TEXT NOT NULL,
    "learningContentId" TEXT NOT NULL,
    "imageUrl"          TEXT NOT NULL,
    "storagePath"       TEXT NOT NULL,
    "imageOrder"        INTEGER NOT NULL DEFAULT 0,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_note_images_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "learning_note_images_learningContentId_fkey" FOREIGN KEY ("learningContentId")
        REFERENCES "learning_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "learning_note_images_learningContentId_idx" ON "learning_note_images"("learningContentId");
CREATE INDEX IF NOT EXISTS "learning_note_images_imageOrder_idx"         ON "learning_note_images"("imageOrder");

-- ── learning_progress ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "learning_progress" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "courseId"       TEXT NOT NULL,
    "contentId"      TEXT NOT NULL,
    "status"         "LearningProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt"      TIMESTAMP(3),
    "completedAt"    TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "learning_progress_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "learning_progress_courseId_fkey" FOREIGN KEY ("courseId")
        REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "learning_progress_contentId_fkey" FOREIGN KEY ("contentId")
        REFERENCES "learning_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "learning_progress_userId_contentId_key" ON "learning_progress"("userId", "contentId");
CREATE INDEX IF NOT EXISTS "learning_progress_userId_idx"    ON "learning_progress"("userId");
CREATE INDEX IF NOT EXISTS "learning_progress_courseId_idx"  ON "learning_progress"("courseId");
CREATE INDEX IF NOT EXISTS "learning_progress_contentId_idx" ON "learning_progress"("contentId");
