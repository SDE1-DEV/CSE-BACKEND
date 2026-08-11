-- ─────────────────────────────────────────────────────────────────────────────
-- PRD-FINAL-01: lesson_progress schema alignment
--
-- PURPOSE
--   The production database may be missing the legacy lesson_progress table
--   (and related tables) even though migration 20260715123406_learning_ecosystem
--   created them. This migration re-creates them idempotently using
--   CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS so it is safe to
--   run on databases that already have the tables.
--
-- RULE 6 compliance: No production tables are dropped. No data is deleted.
-- RULE 3 compliance: Must be applied via `npx prisma migrate deploy`, not db push.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enums (idempotent) ────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ContentType" AS ENUM ('NOTE', 'VIDEO', 'ARTICLE', 'QUIZ', 'ASSIGNMENT', 'PROJECT', 'CODING_PROBLEM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ResourceType" AS ENUM ('PDF', 'VIDEO', 'ARTICLE', 'GITHUB', 'DOCUMENTATION', 'PRACTICE_LINK');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── categories ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "categories" (
    "id"           TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "slug"         TEXT NOT NULL,
    "description"  TEXT,
    "icon"         TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    "deletedAt"    TIMESTAMP(3),
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_key"        ON "categories"("slug");
CREATE INDEX        IF NOT EXISTS "categories_slug_idx"        ON "categories"("slug");
CREATE INDEX        IF NOT EXISTS "categories_isActive_idx"    ON "categories"("isActive");
CREATE INDEX        IF NOT EXISTS "categories_displayOrder_idx" ON "categories"("displayOrder");

-- ── roadmaps ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "roadmaps" (
    "id"             TEXT NOT NULL,
    "categoryId"     TEXT NOT NULL,
    "title"          TEXT NOT NULL,
    "slug"           TEXT NOT NULL,
    "description"    TEXT,
    "thumbnail"      TEXT,
    "difficulty"     "Difficulty" NOT NULL DEFAULT 'BEGINNER',
    "estimatedHours" INTEGER,
    "prerequisites"  TEXT,
    "displayOrder"   INTEGER NOT NULL DEFAULT 0,
    "isPublished"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    "deletedAt"      TIMESTAMP(3),
    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "roadmaps_slug_key"         ON "roadmaps"("slug");
CREATE INDEX        IF NOT EXISTS "roadmaps_slug_idx"         ON "roadmaps"("slug");
CREATE INDEX        IF NOT EXISTS "roadmaps_categoryId_idx"   ON "roadmaps"("categoryId");
CREATE INDEX        IF NOT EXISTS "roadmaps_isPublished_idx"  ON "roadmaps"("isPublished");
CREATE INDEX        IF NOT EXISTS "roadmaps_difficulty_idx"   ON "roadmaps"("difficulty");
CREATE INDEX        IF NOT EXISTS "roadmaps_displayOrder_idx" ON "roadmaps"("displayOrder");
CREATE INDEX        IF NOT EXISTS "roadmaps_deletedAt_idx"    ON "roadmaps"("deletedAt");

-- ── roadmap_sections ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "roadmap_sections" (
    "id"        TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "description" TEXT,
    "order"     INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "roadmap_sections_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "roadmap_sections_roadmapId_idx" ON "roadmap_sections"("roadmapId");
CREATE INDEX IF NOT EXISTS "roadmap_sections_order_idx"     ON "roadmap_sections"("order");

-- ── lessons ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "lessons" (
    "id"               TEXT NOT NULL,
    "sectionId"        TEXT NOT NULL,
    "title"            TEXT NOT NULL,
    "slug"             TEXT NOT NULL,
    "description"      TEXT,
    "contentType"      "ContentType" NOT NULL DEFAULT 'NOTE',
    "estimatedMinutes" INTEGER,
    "order"            INTEGER NOT NULL DEFAULT 0,
    "isPublished"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    "deletedAt"        TIMESTAMP(3),
    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "lessons_slug_key"        ON "lessons"("slug");
CREATE INDEX        IF NOT EXISTS "lessons_slug_idx"        ON "lessons"("slug");
CREATE INDEX        IF NOT EXISTS "lessons_sectionId_idx"   ON "lessons"("sectionId");
CREATE INDEX        IF NOT EXISTS "lessons_isPublished_idx" ON "lessons"("isPublished");
CREATE INDEX        IF NOT EXISTS "lessons_order_idx"       ON "lessons"("order");

-- ── learning_resources ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "learning_resources" (
    "id"        TEXT NOT NULL,
    "lessonId"  TEXT NOT NULL,
    "type"      "ResourceType" NOT NULL,
    "title"     TEXT NOT NULL,
    "url"       TEXT NOT NULL,
    "duration"  INTEGER,
    "author"    TEXT,
    "thumbnail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "learning_resources_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "learning_resources_lessonId_idx" ON "learning_resources"("lessonId");

-- ── lesson_progress ───────────────────────────────────────────────────────────
-- THIS IS THE CRITICAL TABLE referenced by /api/learning/stats.
-- Created idempotently so it is safe on any database state.
CREATE TABLE IF NOT EXISTS "lesson_progress" (
    "id"              TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "lessonId"        TEXT NOT NULL,
    "completed"       BOOLEAN NOT NULL DEFAULT false,
    "completedAt"     TIMESTAMP(3),
    "watchPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent"       INTEGER NOT NULL DEFAULT 0,
    "lastOpened"      TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);
CREATE INDEX        IF NOT EXISTS "lesson_progress_userId_idx"   ON "lesson_progress"("userId");
CREATE INDEX        IF NOT EXISTS "lesson_progress_lessonId_idx" ON "lesson_progress"("lessonId");
CREATE UNIQUE INDEX IF NOT EXISTS "lesson_progress_userId_lessonId_key" ON "lesson_progress"("userId", "lessonId");
-- Performance index for streak computation and activity queries
CREATE INDEX        IF NOT EXISTS "lesson_progress_completedAt_idx" ON "lesson_progress"("completedAt") WHERE "completedAt" IS NOT NULL;

-- ── bookmarks ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "bookmarks" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "lessonId"  TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX        IF NOT EXISTS "bookmarks_userId_idx"         ON "bookmarks"("userId");
CREATE INDEX        IF NOT EXISTS "bookmarks_lessonId_idx"       ON "bookmarks"("lessonId");
CREATE UNIQUE INDEX IF NOT EXISTS "bookmarks_userId_lessonId_key" ON "bookmarks"("userId", "lessonId");

-- ── recently_viewed ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "recently_viewed" (
    "id"       TEXT NOT NULL,
    "userId"   TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recently_viewed_pkey" PRIMARY KEY ("id")
);
CREATE INDEX        IF NOT EXISTS "recently_viewed_userId_idx"           ON "recently_viewed"("userId");
CREATE INDEX        IF NOT EXISTS "recently_viewed_lessonId_idx"         ON "recently_viewed"("lessonId");
CREATE UNIQUE INDEX IF NOT EXISTS "recently_viewed_userId_lessonId_key"  ON "recently_viewed"("userId", "lessonId");

-- ── Foreign key constraints (add only if both tables now exist) ───────────────
DO $$ BEGIN
  ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "roadmap_sections" ADD CONSTRAINT "roadmap_sections_roadmapId_fkey"
    FOREIGN KEY ("roadmapId") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lessons" ADD CONSTRAINT "lessons_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "roadmap_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Additional performance indexes on new CMS tables ─────────────────────────
-- learning_progress (new CMS table) — add updatedAt index for activity queries
CREATE INDEX IF NOT EXISTS "learning_progress_updatedAt_idx"  ON "learning_progress"("updatedAt");
CREATE INDEX IF NOT EXISTS "learning_progress_status_idx"     ON "learning_progress"("status");

-- users — additional indexes for analytics
CREATE INDEX IF NOT EXISTS "users_role_idx"        ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_createdAt_idx"   ON "users"("createdAt");
CREATE INDEX IF NOT EXISTS "users_lastLoginAt_idx" ON "users"("lastLoginAt");

-- submissions — for analytics queries
CREATE INDEX IF NOT EXISTS "submissions_userId_status_idx" ON "submissions"("userId", "status");

-- ── Verification query (left as comment — run manually after deploy) ───────────
-- SELECT EXISTS (
--   SELECT 1 FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name = 'lesson_progress'
-- );
-- Expected: true
