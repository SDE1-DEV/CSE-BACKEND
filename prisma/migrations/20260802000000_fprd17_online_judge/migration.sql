-- FPRD-17: Online Judge + Large Coding Dataset Integration
-- Phase 2: New language enum values
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProgrammingLanguage') THEN
    CREATE TYPE "ProgrammingLanguage" AS ENUM ('C', 'CPP', 'JAVA', 'PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'GO', 'RUST', 'CSHARP', 'KOTLIN');
  END IF;
END $$;

ALTER TYPE "ProgrammingLanguage" ADD VALUE IF NOT EXISTS 'TYPESCRIPT';
ALTER TYPE "ProgrammingLanguage" ADD VALUE IF NOT EXISTS 'GO';
ALTER TYPE "ProgrammingLanguage" ADD VALUE IF NOT EXISTS 'RUST';
ALTER TYPE "ProgrammingLanguage" ADD VALUE IF NOT EXISTS 'CSHARP';
ALTER TYPE "ProgrammingLanguage" ADD VALUE IF NOT EXISTS 'KOTLIN';

-- New enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SourceType') THEN
    CREATE TYPE "SourceType" AS ENUM ('ORIGINAL', 'COMMUNITY', 'LICENSED', 'INTERNAL');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ImportStatus') THEN
    CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ROLLED_BACK');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'JudgeStatus') THEN
    CREATE TYPE "JudgeStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE');
  END IF;
END $$;

-- Phase 12: outputLimit on coding_problems
ALTER TABLE "coding_problems" ADD COLUMN IF NOT EXISTS "outputLimit" INTEGER NOT NULL DEFAULT 64;
-- Phase 17: extended fields
ALTER TABLE "coding_problems" ADD COLUMN IF NOT EXISTS "hints" JSONB;
ALTER TABLE "coding_problems" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "coding_problems" ADD COLUMN IF NOT EXISTS "estimatedTime" INTEGER;
ALTER TABLE "coding_problems" ADD COLUMN IF NOT EXISTS "xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "coding_problems" ADD COLUMN IF NOT EXISTS "license" TEXT DEFAULT 'ORIGINAL';
ALTER TABLE "coding_problems" ADD COLUMN IF NOT EXISTS "sourceType" "SourceType" NOT NULL DEFAULT 'ORIGINAL';
ALTER TABLE "coding_problems" ADD COLUMN IF NOT EXISTS "submissionCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "coding_problems" ADD COLUMN IF NOT EXISTS "acceptedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "coding_problems" ALTER COLUMN "timeLimit" SET DEFAULT 2000;

-- Phase 6: test case extensions
ALTER TABLE "test_cases" ADD COLUMN IF NOT EXISTS "isJudgeOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "test_cases" ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- Phase 5: submission async judge status + error info
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "judgeStatus" "JudgeStatus" NOT NULL DEFAULT 'QUEUED';
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "stderr" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "compileOutput" TEXT;
ALTER TABLE "submissions" ADD COLUMN IF NOT EXISTS "isRun" BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'submissions_judgeStatus_idx') THEN
    CREATE INDEX "submissions_judgeStatus_idx" ON "submissions"("judgeStatus");
  END IF;
END $$;

-- Phase 5: SubmissionTestResult table
CREATE TABLE IF NOT EXISTS "submission_test_results" (
  "id"             TEXT NOT NULL,
  "submissionId"   TEXT NOT NULL,
  "testCaseId"     TEXT NOT NULL,
  "passed"         BOOLEAN NOT NULL DEFAULT false,
  "actualOutput"   TEXT,
  "expectedOutput" TEXT NOT NULL,
  "runtime"        INTEGER,
  "memoryUsed"     INTEGER,
  "errorMessage"   TEXT,
  CONSTRAINT "submission_test_results_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'submission_test_results_submissionId_idx') THEN
    CREATE INDEX "submission_test_results_submissionId_idx" ON "submission_test_results"("submissionId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'submission_test_results_testCaseId_idx') THEN
    CREATE INDEX "submission_test_results_testCaseId_idx" ON "submission_test_results"("testCaseId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'submission_test_results_submissionId_fkey') THEN
    ALTER TABLE "submission_test_results" ADD CONSTRAINT "submission_test_results_submissionId_fkey"
      FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'submission_test_results_testCaseId_fkey') THEN
    ALTER TABLE "submission_test_results" ADD CONSTRAINT "submission_test_results_testCaseId_fkey"
      FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Phase 11: code_drafts (autosave)
CREATE TABLE IF NOT EXISTS "code_drafts" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "problemId" TEXT NOT NULL,
  "language"  "ProgrammingLanguage" NOT NULL,
  "code"      TEXT NOT NULL,
  "savedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "code_drafts_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'code_drafts_userId_problemId_language_key') THEN
    ALTER TABLE "code_drafts" ADD CONSTRAINT "code_drafts_userId_problemId_language_key"
      UNIQUE ("userId", "problemId", "language");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'code_drafts_userId_idx') THEN
    CREATE INDEX "code_drafts_userId_idx" ON "code_drafts"("userId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'code_drafts_problemId_idx') THEN
    CREATE INDEX "code_drafts_problemId_idx" ON "code_drafts"("problemId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'code_drafts_userId_fkey') THEN
    ALTER TABLE "code_drafts" ADD CONSTRAINT "code_drafts_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'code_drafts_problemId_fkey') THEN
    ALTER TABLE "code_drafts" ADD CONSTRAINT "code_drafts_problemId_fkey"
      FOREIGN KEY ("problemId") REFERENCES "coding_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Phase 17: related_problems
CREATE TABLE IF NOT EXISTS "related_problems" (
  "id"     TEXT NOT NULL,
  "fromId" TEXT NOT NULL,
  "toId"   TEXT NOT NULL,
  CONSTRAINT "related_problems_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'related_problems_fromId_toId_key') THEN
    ALTER TABLE "related_problems" ADD CONSTRAINT "related_problems_fromId_toId_key"
      UNIQUE ("fromId", "toId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'related_problems_fromId_idx') THEN
    CREATE INDEX "related_problems_fromId_idx" ON "related_problems"("fromId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'related_problems_toId_idx') THEN
    CREATE INDEX "related_problems_toId_idx" ON "related_problems"("toId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'related_problems_fromId_fkey') THEN
    ALTER TABLE "related_problems" ADD CONSTRAINT "related_problems_fromId_fkey"
      FOREIGN KEY ("fromId") REFERENCES "coding_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'related_problems_toId_fkey') THEN
    ALTER TABLE "related_problems" ADD CONSTRAINT "related_problems_toId_fkey"
      FOREIGN KEY ("toId") REFERENCES "coding_problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Phase 18: dataset_imports
CREATE TABLE IF NOT EXISTS "dataset_imports" (
  "id"             TEXT NOT NULL,
  "filename"       TEXT NOT NULL,
  "sourceType"     "SourceType" NOT NULL DEFAULT 'ORIGINAL',
  "status"         "ImportStatus" NOT NULL DEFAULT 'PENDING',
  "totalProblems"  INTEGER NOT NULL DEFAULT 0,
  "importedCount"  INTEGER NOT NULL DEFAULT 0,
  "failedCount"    INTEGER NOT NULL DEFAULT 0,
  "skippedCount"   INTEGER NOT NULL DEFAULT 0,
  "errorLog"       JSONB,
  "importReport"   JSONB,
  "startedAt"      TIMESTAMP(3),
  "completedAt"    TIMESTAMP(3),
  "importedBy"     TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dataset_imports_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'dataset_imports_importedBy_idx') THEN
    CREATE INDEX "dataset_imports_importedBy_idx" ON "dataset_imports"("importedBy");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'dataset_imports_status_idx') THEN
    CREATE INDEX "dataset_imports_status_idx" ON "dataset_imports"("status");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'dataset_imports_createdAt_idx') THEN
    CREATE INDEX "dataset_imports_createdAt_idx" ON "dataset_imports"("createdAt");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dataset_imports_importedBy_fkey') THEN
    ALTER TABLE "dataset_imports" ADD CONSTRAINT "dataset_imports_importedBy_fkey"
      FOREIGN KEY ("importedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Phase 21: user_topic_progress
CREATE TABLE IF NOT EXISTS "user_topic_progress" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "categoryId"    TEXT NOT NULL,
  "solved"        INTEGER NOT NULL DEFAULT 0,
  "attempted"     INTEGER NOT NULL DEFAULT 0,
  "bookmarked"    INTEGER NOT NULL DEFAULT 0,
  "totalEasy"     INTEGER NOT NULL DEFAULT 0,
  "totalMedium"   INTEGER NOT NULL DEFAULT 0,
  "totalHard"     INTEGER NOT NULL DEFAULT 0,
  "solvedEasy"    INTEGER NOT NULL DEFAULT 0,
  "solvedMedium"  INTEGER NOT NULL DEFAULT 0,
  "solvedHard"    INTEGER NOT NULL DEFAULT 0,
  "completionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "avgRuntime"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_topic_progress_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_topic_progress_userId_categoryId_key') THEN
    ALTER TABLE "user_topic_progress" ADD CONSTRAINT "user_topic_progress_userId_categoryId_key"
      UNIQUE ("userId", "categoryId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'user_topic_progress_userId_idx') THEN
    CREATE INDEX "user_topic_progress_userId_idx" ON "user_topic_progress"("userId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'user_topic_progress_categoryId_idx') THEN
    CREATE INDEX "user_topic_progress_categoryId_idx" ON "user_topic_progress"("categoryId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_topic_progress_userId_fkey') THEN
    ALTER TABLE "user_topic_progress" ADD CONSTRAINT "user_topic_progress_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_topic_progress_categoryId_fkey') THEN
    ALTER TABLE "user_topic_progress" ADD CONSTRAINT "user_topic_progress_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "problem_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Performance indexes (Phase 23)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'coding_problems_sourceType_idx') THEN
    CREATE INDEX "coding_problems_sourceType_idx" ON "coding_problems"("sourceType");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'coding_problems_title_idx') THEN
    CREATE INDEX "coding_problems_title_idx" ON "coding_problems" USING gin(to_tsvector('english', "title"));
  END IF;
END $$;
