-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "content" TEXT;

-- AlterTable
ALTER TABLE "roadmaps" ADD COLUMN     "banner" TEXT,
ADD COLUMN     "learningOutcomes" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "tags" TEXT,
ADD COLUMN     "visibility" TEXT DEFAULT 'PUBLIC';
