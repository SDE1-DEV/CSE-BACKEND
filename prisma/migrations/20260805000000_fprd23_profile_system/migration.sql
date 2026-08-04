-- FPRD-23: Profile System (Production Ready)
-- Adds new profile fields: username, headline, social links, privacy, resume URL, lastSeen

-- Add username (unique, optional)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "headline" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitterUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "leetcodeUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "codechefUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hackerrankUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "codeforcesUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gfgUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mediumUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resumeUrl" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileVisibility" TEXT DEFAULT 'PUBLIC';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastSeen" TIMESTAMP(3);

-- Create unique index on username (partial, allows multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username") WHERE "username" IS NOT NULL;

-- Create index on username for fast lookups
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");
