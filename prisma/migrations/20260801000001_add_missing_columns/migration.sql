-- Add missing columns that exist in schema but not in DB
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileCompletion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

-- Ensure quiz/practice tables exist (idempotent)
CREATE TABLE IF NOT EXISTS "lesson_practice_questions" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "hint" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'BEGINNER',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lesson_practice_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quiz_questions" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'BEGINNER',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "quiz_options" (
    "id" TEXT NOT NULL,
    "quizQuestionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("id")
);

-- Indexes (IF NOT EXISTS equivalent via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'lesson_practice_questions_lessonId_idx') THEN
    CREATE INDEX "lesson_practice_questions_lessonId_idx" ON "lesson_practice_questions"("lessonId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quiz_questions_lessonId_idx') THEN
    CREATE INDEX "quiz_questions_lessonId_idx" ON "quiz_questions"("lessonId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quiz_options_quizQuestionId_idx') THEN
    CREATE INDEX "quiz_options_quizQuestionId_idx" ON "quiz_options"("quizQuestionId");
  END IF;
END $$;

-- Foreign keys (ignore if already exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_practice_questions_lessonId_fkey') THEN
    ALTER TABLE "lesson_practice_questions" ADD CONSTRAINT "lesson_practice_questions_lessonId_fkey"
      FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_questions_lessonId_fkey') THEN
    ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_lessonId_fkey"
      FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_options_quizQuestionId_fkey') THEN
    ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_quizQuestionId_fkey"
      FOREIGN KEY ("quizQuestionId") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
