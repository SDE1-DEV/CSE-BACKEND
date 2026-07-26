-- FPRD-11: Soft delete support
-- Adds a nullable `deletedAt` column + index to all manager-deletable content models.

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "roadmaps" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "roadmap_sections" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "lessons" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "learning_resources" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "problem_categories" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "coding_problems" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "project_categories" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "companies" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "job_postings" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "banners" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "faqs" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "testimonials" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "media_files" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "categories_deletedAt_idx" ON "categories"("deletedAt");
CREATE INDEX "roadmaps_deletedAt_idx" ON "roadmaps"("deletedAt");
CREATE INDEX "roadmap_sections_deletedAt_idx" ON "roadmap_sections"("deletedAt");
CREATE INDEX "lessons_deletedAt_idx" ON "lessons"("deletedAt");
CREATE INDEX "learning_resources_deletedAt_idx" ON "learning_resources"("deletedAt");
CREATE INDEX "problem_categories_deletedAt_idx" ON "problem_categories"("deletedAt");
CREATE INDEX "coding_problems_deletedAt_idx" ON "coding_problems"("deletedAt");
CREATE INDEX "project_categories_deletedAt_idx" ON "project_categories"("deletedAt");
CREATE INDEX "projects_deletedAt_idx" ON "projects"("deletedAt");
CREATE INDEX "companies_deletedAt_idx" ON "companies"("deletedAt");
CREATE INDEX "job_postings_deletedAt_idx" ON "job_postings"("deletedAt");
CREATE INDEX "events_deletedAt_idx" ON "events"("deletedAt");
CREATE INDEX "banners_deletedAt_idx" ON "banners"("deletedAt");
CREATE INDEX "faqs_deletedAt_idx" ON "faqs"("deletedAt");
CREATE INDEX "testimonials_deletedAt_idx" ON "testimonials"("deletedAt");
CREATE INDEX "media_files_deletedAt_idx" ON "media_files"("deletedAt");
