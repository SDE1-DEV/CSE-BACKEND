-- CreateTable: lesson_practice_questions
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

-- CreateTable: quiz_questions
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

-- CreateTable: quiz_options
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lesson_practice_questions_lessonId_idx" ON "lesson_practice_questions"("lessonId");
CREATE INDEX IF NOT EXISTS "lesson_practice_questions_displayOrder_idx" ON "lesson_practice_questions"("displayOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "quiz_questions_lessonId_idx" ON "quiz_questions"("lessonId");
CREATE INDEX IF NOT EXISTS "quiz_questions_displayOrder_idx" ON "quiz_questions"("displayOrder");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "quiz_options_quizQuestionId_idx" ON "quiz_options"("quizQuestionId");

-- AddForeignKey
ALTER TABLE "lesson_practice_questions" ADD CONSTRAINT "lesson_practice_questions_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_lessonId_fkey"
  FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_quizQuestionId_fkey"
  FOREIGN KEY ("quizQuestionId") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
