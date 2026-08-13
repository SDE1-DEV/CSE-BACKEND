-- CreateTable
CREATE TABLE "course_pdfs" (
    "id"           TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "description"  TEXT,
    "fileUrl"      TEXT NOT NULL,
    "fileName"     TEXT NOT NULL,
    "fileSize"     INTEGER NOT NULL DEFAULT 0,
    "isPublished"  BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy"   TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    "deletedAt"    TIMESTAMP(3),

    CONSTRAINT "course_pdfs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_pdfs_isPublished_idx"  ON "course_pdfs"("isPublished");
CREATE INDEX "course_pdfs_displayOrder_idx" ON "course_pdfs"("displayOrder");
CREATE INDEX "course_pdfs_deletedAt_idx"    ON "course_pdfs"("deletedAt");
