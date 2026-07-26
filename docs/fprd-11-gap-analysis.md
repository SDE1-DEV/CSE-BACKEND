# FPRD-11 — Gap Analysis (Manager CMS Stabilization & Production Readiness)

> **Purpose:** Map every FPRD-11 phase (1–22) to the *actual* current state of the codebase,
> flag real gaps, and give a prioritized remediation backlog. This is an audit document — no
> production code was changed to produce it.
>
> **Audited on:** fresh read of `CSE-BACKEND/CODE` and `CSE-FRONTEND/cse-student-platform`.

## Executive summary

The premise of FPRD-11 ("remove mock data, make everything real") is **already largely satisfied**:

- **Zero mock data.** No `mock`/`fake`/`TODO`/`placeholder` in the backend `src`. The frontend has
  none in the Manager area either. Every Manager controller delegates to a **real Prisma-backed**
  `managerService` / `cmsExtrasService`.
- **Full CRUD + routing + permission gating exists** for all modules (Learning, Coding, Projects,
  Placements, Events, Notifications, Banners, FAQ, Testimonials, Media, Versions, Search).
- The frontend is a genuine React Query app (`queryClient.ts` already tuned for FPRD-11: retry,
  backoff, staleTime, background refetch).

So the work is **not** "build the CMS" — it is **hardening**. The genuine, high-impact gaps are:

| # | Gap | Severity | Phase |
|---|-----|----------|-------|
| 1 | **`seed.ts` seeds only 2 users** → every dependent dropdown (category/company/tag) is empty on a fresh DB. This *is* the "empty Category dropdown" bug. | 🔴 Critical | 2,3,22 |
| 2 | **No Prisma `$transaction`** anywhere in Manager services — multi-step ops (duplicate, broadcast) are non-atomic. | 🔴 High | 14 |
| 3 | **No soft delete** — all deletes are hard `delete()`. No `deletedAt`/`deletedBy`/`version` columns; "restore" only flips `isPublished`. | 🔴 High | 15 |
| 4 | **Validators exist but are not wired** into Manager routes (only `notifications` uses `validate()`). `req.body` is cast straight to Prisma. | 🟠 High | 16 |
| 5 | **Inconsistent audit logging** — many mutations (Learning categories/sections/resources, company/job/event/notification updates & deletes, testimonial/faq/media deletes) write no audit entry. | 🟠 Medium | 21 |
| 6 | **Version history is cosmetic** — only Banner & FAQ `update` snapshot; `restoreVersion` logs but does **not** re-apply the old value. | 🟠 Medium | 2,15 |
| 7 | **Notifications lack** scheduling, email/push channels, retry, delivery status. | 🟡 Medium | 9 |
| 8 | **No Import** (Export exists). Media upload is metadata-only (no multipart handler in manager routes). | 🟡 Medium | 2,8 |
| 9 | **No React ErrorBoundary**; some pages lack explicit empty/permission-denied/offline states. | 🟡 Low | 17,22 |

**Legend:** ✅ Present & adequate · ⚠️ Partial / needs work · ❌ Missing

---

## Phase 1 — Backend Audit

For each Manager module the layered chain was verified: **Route → Controller → Service → Prisma → Table → FK → Validation → Permission → Audit → Response DTO.**

| Layer | State | Evidence |
|-------|-------|----------|
| Route | ✅ | `src/routes/manager.routes.ts` (314 lines) covers all modules |
| Controller | ✅ | `controllers/manager/manager.controller.ts` (680) + `cms-extras.controller.ts` (197) |
| Service | ✅ | `services/manager/manager.service.ts` (1070) + `cms-extras.service.ts` (288) |
| Prisma query | ✅ | Real `prisma.*` calls throughout |
| DB table | ✅ | `prisma/schema.prisma` models exist for all entities |
| Foreign keys | ✅ | `onDelete: Cascade` relations present (schema L169–468) |
| Validation schema | ⚠️ | Zod files exist for most entities **but not wired into manager routes** |
| Permission middleware | ✅ | `requirePermission` / `requirePublishPermission` on every write route |
| Audit log | ⚠️ | Present for many ops, **missing on several** (see Phase 21) |
| Response DTO | ⚠️ | Uses `sendSuccess`/`sendCreated`; raw Prisma objects returned (no strict DTO shaping) |

**Verdict:** ⚠️ The chain exists end-to-end; the missing links are *validation wiring* and *audit consistency*, not missing endpoints.

---

## Phase 2 — Learning CMS

Category → Roadmap → Section → Lesson → Resource hierarchy.

| Feature | State | Notes |
|---------|-------|-------|
| CRUD (all 5 levels) | ✅ | `manager.service.ts` L534–717 |
| FK enforcement / no orphans | ✅ | `onDelete: Cascade` on category→roadmap→section→lesson→resource |
| Publish / Archive | ✅ | Roadmap only; lessons have `isPublished` via update |
| Draft / Restore | ⚠️ | Draft = `isPublished:false`; **no soft-delete restore** |
| Version History | ⚠️ | `contentVersion` table exists; **not written on lesson/roadmap update** (only Banner/FAQ) |
| Search / Pagination / Sort / Filter | ✅ | `getLessons`/`getRoadmaps` support `search/status/page/limit` |
| Bulk ops | ✅ | `bulkPublish/Archive/Delete/Restore` (roadmaps/problems/projects/jobs/events) |
| Export | ✅ | `exportContent` JSON+CSV for roadmaps/lessons |
| Import | ❌ | No import path anywhere |
| Autosave / Recover draft | ⚠️ | Frontend `DraftRecoveryBanner.tsx` exists (localStorage); **not persisted server-side** |
| Lesson editor rich fields (quiz, assignment, video, files) | ⚠️ | Lesson model + form support core fields; quiz/assignment not modeled as first-class |

**Gaps:** Import; server-side autosave; version snapshots on Learning entities; true restore.

---

## Phase 3 — Coding CMS  *(the explicitly-reported bug)*

**Reported:** "Manager cannot create question because Category dropdown is empty."

**Root cause (confirmed):** The wiring is **correct** — `getProblemCategories`
(`manager.service.ts` L247) returns `{ data, total }`, the controller returns it under
`data`, and the frontend correctly reads `r.data.data?.data`
(`ManagerCodingPage.tsx` L37). The dropdown is empty because **`prisma/seed.ts` never
creates any `problemCategory` rows** — it only creates one admin + one student user
(`seed.ts` L27, L55). On a fresh DB the table is genuinely empty.

| Feature | State | Notes |
|---------|-------|-------|
| Category CRUD + "appears immediately" | ✅ | Create → React Query invalidates `problem-categories` |
| Problem CRUD | ✅ | `manager.service.ts` L721–792 |
| Dependency flow (Category → Problem) | ✅ code / 🔴 data | Works once a category exists |
| Test cases / Templates | ✅ | Duplicated in `duplicateProblem`; dedicated routes `test-case.routes.ts`, `code-template.routes.ts` |
| Companies / Tags / Hints / Editorial / Solutions dropdowns | ⚠️ | Company & tag models exist but **unseeded** → empty dropdowns |
| Publish / Archive | ✅ | |

**Fix:** Seed problem categories (and companies/tags). No code change needed to the dropdown itself.

---

## Phase 4 — Projects CMS

| Feature | State | Notes |
|---------|-------|-------|
| Project Category CRUD | ✅ | `manager.service.ts` L305–340 |
| Project CRUD | ✅ | L796–836 |
| Tech stack / GitHub / images / difficulty / duration | ✅ | `project` include `technologies` |
| Publish / Archive / Restore | ⚠️ | Publish/Archive ✅; restore = flip `isPublished` only |
| Category dropdown | 🔴 data | Empty until `projectCategory` seeded |

---

## Phase 5 — Placement CMS

| Feature | State | Notes |
|---------|-------|-------|
| Company CRUD | ✅ | L840–863 |
| Job CRUD + publish | ✅ | L865–888, `publishJob` |
| Rounds / Interview experience / eligibility / deadline | ⚠️ | Depends on `jobPosting` schema fields; verify columns exist for all |
| Company dropdown (for jobs) | 🔴 data | Empty until companies seeded |

---

## Phase 6 — Events CMS

| Feature | State | Notes |
|---------|-------|-------|
| Event CRUD | ✅ | L892–915 |
| Registrations | ✅ | `getEventRegistrations` L917 |
| Publish / Archive | ✅ | L479–493 |
| Banner / venue / online link / speakers / seats / certificate | ⚠️ | Depends on `event` model fields; some may be missing |
| Status (Upcoming/Live/Completed) | ⚠️ | Derived from `startTime`; no explicit lifecycle enum enforcement |

---

## Phase 7 — Banner CMS

| Feature | State | Notes |
|---------|-------|-------|
| Create / Edit / Delete | ✅ | `cms-extras.service.ts` L25–57 |
| Schedule (`scheduledAt`/`expiresAt`) | ✅ | Persisted on create |
| Priority / Placement / Visibility | ✅ | `priority`, `placement`, `isActive` |
| Version snapshot on edit | ✅ | `updateBanner` calls `_saveVersion` |
| Delete audit | ✅ | |

**Verdict:** ✅ Banners are the most complete module.

---

## Phase 8 — Media Library

| Feature | State | Notes |
|---------|-------|-------|
| List / search / filter / folders / pagination | ✅ | `getMediaFiles`, `getMediaFolders` |
| Create metadata / rename / delete | ✅ | L190–214 |
| **Actual file upload (multipart)** | ❌ | Manager routes accept `fileUrl` metadata only; no `multer`/upload handler on `/manager/media` |
| Storage usage | ⚠️ | `fileSize` stored per file; no aggregate endpoint |
| Delete audit | ❌ | `deleteMediaFile` writes no audit entry |

**Note:** A generic upload mechanism may exist elsewhere (`uploads/`, Supabase config present); the manager media route itself does not perform uploads.

---

## Phase 9 — Notification System

| Feature | State | Notes |
|---------|-------|-------|
| Individual send | ✅ | `createNotification` |
| Broadcast (role-based) | ✅ | `broadcastNotification` (createMany) |
| History | ✅ | `getNotifications` |
| **Scheduled** | ❌ | No scheduledAt handling / job |
| **Email / Push channels** | ❌ | DB notification only (queues dir exists but not wired here) |
| **Retry / Delivery status** | ❌ | No status tracking |

**Gap:** Broadcast is not transactional (see Phase 14); no multi-channel delivery.

---

## Phase 10 — FAQ CMS

| Feature | State | Notes |
|---------|-------|-------|
| Category CRUD | ✅ | `cms-extras.service.ts` L61–89 |
| FAQ CRUD | ✅ | L104–130 |
| Order / Visibility / Search | ✅ | `displayOrder`, `isPublished`, search |
| Version on edit | ✅ | `updateFaq` → `_saveVersion` |
| Delete audit | ⚠️ | `deleteFaq` writes no audit; category delete does |

---

## Phase 11 — Testimonials

| Feature | State | Notes |
|---------|-------|-------|
| CRUD | ✅ | L146–173 |
| Name / image / college / rating / review / featured / visibility | ✅ | All fields present |
| Update / delete audit | ❌ | `updateTestimonial` & `deleteTestimonial` write no audit |

---

## Phase 12 — Global Search

| Feature | State | Notes |
|---------|-------|-------|
| Cross-module search | ⚠️ | `globalSearch` covers roadmaps, lessons, problems, projects, companies, events, resources |
| **FAQ / Testimonials / Media not searched** | ❌ | Missing from `globalSearch` union |
| Highlight matches | ❌ | No highlight metadata returned (frontend would need match ranges) |

---

## Phase 13 — Permission Enforcement

| Check | State | Notes |
|-------|-------|-------|
| JWT | ✅ | `authenticate` middleware on all routes |
| Role | ✅ | `requireManager`; SUPER_ADMIN bypass |
| Permission (module + action) | ✅ | `requirePermission` checks JWT + granular DB flags |
| Ownership | ⚠️ | Not enforced (content is org-global, likely N/A) |
| Organization | ⚠️ | Single-tenant model; N/A |
| Backend-enforced (not just FE) | ✅ | All gating server-side |

**Minor risk:** `permission.middleware.ts` L113 `catch {}` silently falls back to JWT-level access if the DB lookup throws — this weakens the granular check on DB error. Consider failing closed.

---

## Phase 14 — Transactions

| Requirement | State | Notes |
|-------------|-------|-------|
| Every create/update/delete uses `$transaction` | ❌ | **No `$transaction` in any Manager service** |
| Rollback on partial failure | ❌ | `duplicateRoadmap` (L411) & `duplicateProblem` (L437) run **loops of separate creates** — a mid-loop failure leaves orphan/partial copies |
| Broadcast atomicity | ❌ | `broadcastNotification` createMany + audit are separate |

**Gap:** Wrap multi-write operations (duplicate, broadcast, create-with-children, bulk) in `prisma.$transaction`.

---

## Phase 15 — Database Integrity

| Item | State | Notes |
|------|-------|-------|
| Foreign Keys | ✅ | Present with `onDelete: Cascade` |
| Cascade rules | ✅ | Category→…→Resource cascades |
| Indexes | ⚠️ | Some `@unique` (slug) exist; verify `@@index` on hot filter columns (isPublished, categoryId, createdAt) |
| Unique constraints | ✅ | slug uniqueness on categories/roadmaps/etc. |
| **Soft Delete (`deletedAt`)** | ❌ | Not modeled — 0 occurrences in schema |
| **Restore (from soft delete)** | ❌ | `bulkRestore` only flips `isPublished` |
| **`createdBy`** | ⚠️ | Only Banner/FAQ/Testimonial/Media have it; core content does not |
| **`updatedBy` / `deletedBy`** | ❌ | Not modeled anywhere |
| **`version` column** | ❌ | Only on `contentVersion` rows, not on entities |

**Gap:** This is the largest schema effort — adding `deletedAt/deletedBy/updatedBy/version` +
migration + repository-wide `where: { deletedAt: null }` filters.

---

## Phase 16 — Validation

| Item | State | Notes |
|------|-------|-------|
| Zod schemas authored | ✅ | `validators/*` for category, roadmap, lesson, section, coding-problem, problem-category, project, company, job-posting, event, etc. |
| **Wired into Manager routes** | ❌ | Only `POST /notifications` + `/broadcast` + bulk use `validate()`. All other Manager writes skip validation |
| String length / required / duplicate / slug / file / URL / markdown | ⚠️ | Enforced *inside some services* (slug dupes via `findUnique`) but not consistently at the edge |

**Gap:** Attach existing Zod validators (or manager-specific ones) to every Manager write route.

---

## Phase 17 — Frontend Stability

| Item | State | Notes |
|------|-------|-------|
| Loading / skeleton | ✅ | `CMSTable` has `loading` prop; skeletons used |
| Retry / Error UI | ⚠️ | Retry at query level (queryClient); per-page error surfaces vary |
| Empty state | ⚠️ | Present in `CMSTable`; not all custom pages |
| Permission Denied UI | ❌ | No dedicated 403 UI in Manager pages |
| Offline | ❌ | `refetchOnReconnect` set, but no offline banner |
| Replace silent catch / console.log | ⚠️ | Mutations use toasts; a few `console.error` remain (e.g. queryClient global) |

---

## Phase 18 — React Query

| Item | State | Notes |
|------|-------|-------|
| Auto refresh / background refetch | ✅ | `refetchOnWindowFocus/Reconnect/Mount`, staleTime 2m |
| Cache / gcTime | ✅ | gcTime 10m |
| Invalidation | ✅ | Mutations invalidate relevant keys |
| Optimistic updates | ❌ | Not implemented (mutations refetch instead) |
| Pagination | ✅ | Page-based across tables |
| Infinite loading / Prefetch | ❌ | Not used |

**Verdict:** ✅ Strong baseline (already FPRD-11-tagged in `queryClient.ts`); optional extras missing.

---

## Phase 19 — Error Handling (meaningful messages)

| Item | State | Notes |
|------|-------|-------|
| Duplicate slug / name | ✅ | Services throw specific messages ("A category with slug … already exists") |
| Not found | ✅ | "Roadmap not found" etc. |
| Dependency block on delete | ✅ | "Cannot delete: N problem(s) depend on this category" |
| Permission denied text | ✅ | Middleware returns module/action-specific messages |
| Generic Prisma errors → friendly text | ⚠️ | Depends on central error middleware mapping (verify P2002/P2025 handling) |

---

## Phase 20 — Performance

| Item | State | Notes |
|------|-------|-------|
| Pagination | ✅ | All list endpoints |
| Cursor pagination | ❌ | Offset only |
| DB indexes | ⚠️ | Partial (see Phase 15) |
| N+1 removal | ✅ | Uses `include` + `_count` selects |
| Memoization / virtual tables (FE) | ⚠️ | Standard tables; no virtualization |
| Redis caching | ✅ | Dashboard cached (`manager.service.ts` L18–105) |

---

## Phase 21 — Audit Logging

| Action group | Logged? |
|--------------|---------|
| Roadmap/Problem/Project create·update·delete·publish·archive·duplicate | ✅ |
| Banner/FAQcat create·update·delete; FAQ/Testimonial/Media create | ⚠️ mixed |
| **Learning Category create/update/delete** | ❌ |
| **Section create/update/delete** | ❌ |
| **Resource create/update/delete** | ❌ |
| **Company update/delete, Job update/delete, Event update/delete** | ❌ |
| **Notification update/delete** | ❌ |
| **Testimonial update/delete, FAQ delete, Media delete** | ❌ |
| Login / Logout | ✅ elsewhere (auth) |
| Permission change | ✅ (role-management) |

**Gap:** Add `auditLogRepository.create(...)` to the ~15 unlogged mutations for full coverage.

---

## Phase 22 — Testing / Acceptance

No automated Manager E2E suite found (`vitest.config.ts` exists; manager workflow tests not
present). Acceptance requires manual end-to-end runs per the FPRD checklist. The **#1 blocker** to
any manual test pass is the empty seed (Phase 3 root cause): without seeded categories/companies,
create flows appear "broken."

| Blocker | Fix |
|---------|-----|
| Empty dropdowns everywhere | Expand `seed.ts` with categories, problem categories, project categories, companies, tags |
| Non-atomic duplicate/broadcast | Phase 14 transactions |
| No React ErrorBoundary | Add top-level boundary to catch render errors |

---

## Prioritized remediation backlog

Ordered by impact/effort. Each item is independently shippable.

### P0 — Unblocks all manual testing (small effort, huge impact)
1. **Expand `prisma/seed.ts`** to create: Learning categories, roadmaps/sections/lessons,
   problem categories (+ companies, tags), project categories, placement companies, sample events,
   FAQ categories. → Fixes every "empty dropdown" including the reported Coding bug.

### P1 — Data-integrity correctness
2. **Wrap multi-write ops in `prisma.$transaction`** (Phase 14): `duplicateRoadmap`,
   `duplicateProblem`, `broadcastNotification`, bulk actions.
3. **Wire Zod validation** into all Manager write routes (Phase 16).
4. **Complete audit logging** on the ~15 unlogged mutations (Phase 21).

### P2 — Feature completeness
5. **Soft delete** (`deletedAt`/`deletedBy`) + real restore + `updatedBy`/`version` columns
   (Phase 15) — requires migration + query filters.
6. **Real version snapshots** on Learning/Coding/Project updates and functional `restoreVersion`
   (re-apply old value) (Phase 2/15).
7. **Global search**: add FAQ, Testimonials, Media; return match highlight ranges (Phase 12).

### P3 — Polish
8. Notifications: scheduling + delivery status + retry (Phase 9).
9. Media: real multipart upload handler + storage-usage endpoint + delete audit (Phase 8).
10. Frontend: ErrorBoundary, permission-denied & offline states, optimistic updates (Phases 17/18).
11. Import counterpart to Export; cursor pagination + hot-column indexes (Phases 2/20).

---

## Suggested execution order (next session)

1. **P0 seed** — verify locally: run migrate + seed, log in as manager, confirm Coding/Learning/
   Projects/Placements dropdowns populate and a full create → publish flow works end-to-end.
2. **P1 batch** (transactions + validation wiring + audit completion) — low-risk, high-value,
   type-checkable.
3. **P2 schema migration** (soft delete/version) — larger, needs a Prisma migration + query updates.
4. **P3 polish** iteratively.
