# Database Schema Contract
**PRD-FINAL-01 §74 — Production Schema Reference**

This document is the single source of truth for the CSE Student Platform database schema.
It must be kept in sync with `prisma/schema.prisma`.

---

## Migration Policy

- **Never** use `prisma db push` in production.
- **Always** deploy via `npx prisma migrate deploy`.
- All migrations must be committed to Git before deployment.
- Migration failure = deployment failure (prevents new code running against old schema).
- Never run `prisma migrate reset` against production.

## Database

- **Provider:** PostgreSQL (Supabase)
- **ORM:** Prisma 5.x
- **Schema:** `public`
- **Connection pooling:** `DATABASE_URL` uses PgBouncer (pooled, port 6543).
- **Direct URL:** `DIRECT_URL` bypasses PgBouncer — used by `prisma migrate deploy`.

---

## NEW Learning CMS Models (Prisma-managed)

These tables are fully managed by Prisma migrations and the Prisma Client.

| Prisma Model      | PostgreSQL Table       | Description                        |
|-------------------|------------------------|------------------------------------|
| `Course`          | `courses`              | Learning course                    |
| `Level`           | `levels`               | Level within a course              |
| `LearningContent` | `learning_contents`    | Day-level content (video/reel)     |
| `LearningNoteImage` | `learning_note_images` | Note images for a content item  |
| `LearningProgress` | `learning_progress`   | Student progress on content items  |

### Critical Indexes — `learning_progress`

```sql
CREATE UNIQUE INDEX "learning_progress_userId_contentId_key" ON "learning_progress"("userId", "contentId");
CREATE INDEX "learning_progress_userId_idx"    ON "learning_progress"("userId");
CREATE INDEX "learning_progress_courseId_idx"  ON "learning_progress"("courseId");
CREATE INDEX "learning_progress_contentId_idx" ON "learning_progress"("contentId");
CREATE INDEX "learning_progress_updatedAt_idx" ON "learning_progress"("updatedAt");
CREATE INDEX "learning_progress_status_idx"    ON "learning_progress"("status");
```

---

## LEGACY Learning Ecosystem Tables (Raw SQL only)

These tables physically exist in production (created by migration `20260715123406_learning_ecosystem`)
but were removed from `schema.prisma` when the new CMS was introduced.

**ALL access must use `prisma.$queryRaw` or `prisma.$executeRaw`.**
**NEVER add Prisma models for these tables** — it would break migration history.

| PostgreSQL Table       | Raw SQL table name     | Key Columns                                      |
|------------------------|------------------------|--------------------------------------------------|
| `categories`           | `"categories"`         | `id`, `slug`, `isPublished`, `deletedAt`        |
| `roadmaps`             | `"roadmaps"`           | `id`, `slug`, `categoryId`, `deletedAt`         |
| `roadmap_sections`     | `"roadmap_sections"`   | `id`, `roadmapId`, `order`, `deletedAt`         |
| `lessons`              | `"lessons"`            | `id`, `sectionId`, `slug`, `isPublished`, `deletedAt` |
| `learning_resources`   | `"learning_resources"` | `id`, `lessonId`, `type`                        |
| `lesson_progress`      | `"lesson_progress"`    | `id`, `userId`, `lessonId`, `completed`, `completedAt`, `watchPercentage`, `timeSpent`, `lastOpened` |
| `bookmarks`            | `"bookmarks"`          | `id`, `userId`, `lessonId`                      |
| `recently_viewed`      | `"recently_viewed"`    | `id`, `userId`, `lessonId`, `viewedAt`          |

### Critical: `lesson_progress` Table

- **Why it matters:** `GET /api/learning/stats` queries this table.
- **42P01 root cause:** Table absent in production — apply migration `20260811000000_lesson_progress_schema_alignment`.
- **Safe query pattern:** Always wrap in `try/catch` and log WARN (not ERROR) on failure; fall back to legacy-zeros but still return new CMS data.

---

## Other Prisma Models (Core Platform)

| Prisma Model          | PostgreSQL Table            |
|-----------------------|-----------------------------|
| `User`                | `users`                     |
| `RefreshToken`        | `refresh_tokens`            |
| `CodingProblem`       | `coding_problems`           |
| `Submission`          | `submissions`               |
| `DailyChallenge`      | `daily_challenges`          |
| `Team`                | `teams`                     |
| `TeamMember`          | `team_members`              |
| `JobPosting`          | `job_postings`              |
| `JobApplication`      | `job_applications`          |
| `UserAnalytics`       | `user_analytics`            |
| `ManagerPermission`   | `manager_permissions`       |
| `AuditLog`            | `audit_logs`                |
| `PlatformMetric`      | `platform_metrics`          |
| `SystemLog`           | `system_logs`               |
| `Notification`        | `notifications`             |

---

## Important Relations

```
User ──→ LearningProgress ←── LearningContent
LearningContent ──→ Level ──→ Course
User ──→ Submission ──→ CodingProblem
User ──→ TeamMember ──→ Team ──→ Project
User ──→ JobApplication ──→ JobPosting
```

---

## Migration History

| Migration                                        | Description                               |
|--------------------------------------------------|-------------------------------------------|
| `20260715122610_init`                            | Users, auth, base tables                 |
| `20260715123406_learning_ecosystem`              | Legacy roadmaps/lessons/lesson_progress  |
| `20260715131433_coding_practice_platform`        | Coding problems, submissions             |
| `20260715132426_project_hub_team_collaboration`  | Teams, projects, tasks                   |
| `20260716055339_prd05_placement_ecosystem`       | Jobs, events, notifications              |
| `20260716220817_prd07_role_management_manager_console` | Manager permissions, audit logs  |
| `20260717120226_fprd10_cms_banners_faq_media_versions` | Banners, FAQs, media            |
| `20260717175943_fprd10_lesson_content_roadmap_seo` | SEO fields on roadmaps/lessons        |
| `20260719120000_fprd11_soft_delete`              | deletedAt columns                        |
| `20260801000000_quiz_practice_tables`            | Quiz/practice question tables            |
| `20260801000001_add_missing_columns`             | Missing columns backfill                 |
| `20260802000000_fprd17_online_judge`             | Judge, code templates, test cases        |
| `20260805000000_fprd23_profile_system`           | Extended profile fields                  |
| `20260810000000_learning_cms`                    | NEW CMS: courses/levels/learning_progress|
| `20260811000000_lesson_progress_schema_alignment`| Idempotent re-creation of legacy tables  |

---

## Naming Convention

- PostgreSQL tables: `snake_case`
- Prisma models: `PascalCase`
- All `@map("snake_case")` decorators present on every model.
- New tables follow the same convention.
