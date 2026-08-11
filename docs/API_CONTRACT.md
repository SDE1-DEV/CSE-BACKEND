# API Contract
**PRD-FINAL-01 §75 — API Reference**

Base URL: `https://<render-backend>.onrender.com/api`  
Auth: `Authorization: Bearer <accessToken>` on all protected routes.

---

## Authentication — `/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register new student |
| POST | `/auth/login` | — | Login, returns `{ user, accessToken, refreshToken }` |
| POST | `/auth/logout` | — | Invalidate refresh token |
| POST | `/auth/refresh` | — | Rotate tokens, body: `{ refreshToken }` |
| GET  | `/auth/me` | ✓ | Current user (always fresh from DB) |
| PATCH | `/auth/change-password` | ✓ | Change password |
| PATCH | `/auth/update-profile` | ✓ | Update profile fields |
| POST | `/auth/forgot-password` | — | Send reset OTP |
| POST | `/auth/reset-password` | — | Reset with OTP |

**Token refresh flow (one attempt per request cycle):**
```
401 → refresh ONCE → retry → success or logout
```

---

## Health — `/health`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | — | Liveness: process alive |
| GET | `/health/ready` | — | Readiness: DB + Redis connected |
| GET | `/health/database` | — | DB latency |
| GET | `/health/cache` | — | Redis status |
| GET | `/health/queue` | — | BullMQ queues |

---

## Learning (Student) — `/learning`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/learning/dashboard` | ✓ | `StudentLearningDashboard` |
| GET | `/learning/roadmap` | ✓ | Flat roadmap (first published course) |
| GET | `/learning/continue` | ✓ | `ContinueLearningResult \| null` |
| GET | `/learning/courses` | ✓ | All published courses with progress |
| GET | `/learning/courses/:courseId` | ✓ | Course detail + levels |
| GET | `/learning/courses/:courseId/roadmap` | ✓ | Course roadmap |
| GET | `/learning/content/:id` | ✓ | Content detail (marks IN_PROGRESS) |
| POST | `/learning/content/:id/start` | ✓ | Mark IN_PROGRESS |
| POST | `/learning/content/:id/complete` | ✓ | Mark COMPLETED |
| POST | `/learning/content/:id/progress` | ✓ | Update progress status |
| GET | `/learning/progress` | ✓ | All course progress |
| GET | `/learning/stats` | ✓ | Learning statistics |
| GET | `/learning/roadmaps` | optional | Legacy roadmap list |
| GET | `/learning/roadmaps/:slug` | optional | Legacy roadmap detail |
| GET | `/learning/lessons/:id` | optional | Legacy lesson |
| POST | `/learning/lessons/:id/complete` | ✓ | Mark legacy lesson complete |

---

## Coding — `/coding`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/coding/problems` | optional | Problem list with filters |
| GET | `/coding/problems/:slug` | optional | Problem detail |
| POST | `/coding/submit` | ✓ | Submit solution |
| GET | `/coding/submissions` | ✓ | My submissions |
| GET | `/coding/daily` | optional | Today's daily challenge |
| GET | `/coding/analytics` | ✓ | Coding stats |
| GET | `/coding/topics` | — | Topics list |
| GET | `/coding/favorites` | ✓ | Favorite problems |
| POST | `/coding/favorites` | ✓ | Toggle favorite |

---

## Dashboard — `/dashboard`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/dashboard/daily-tasks` | ✓ | Today's coding + lesson task |
| GET | `/dashboard/activity` | ✓ | Activity heatmap |

---

## Leaderboard — `/leaderboard`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/leaderboard` | ✓ | XP-based ranking (top 50) |

---

## Analytics (Student) — `/analytics`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analytics` | ✓ | Overall student analytics |
| GET | `/analytics/heatmap` | ✓ | Activity heatmap data |

---

## Projects — `/projects`, `/teams`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/projects` | optional | Published projects |
| GET | `/projects/:slug` | optional | Project detail |
| GET | `/teams` | ✓ | My teams |
| POST | `/teams` | ✓ | Create team |
| GET | `/my-teams` | ✓ | Teams I belong to |
| GET | `/dashboard/project` | ✓ | Project dashboard |

---

## Placement — `/jobs`, `/job-applications`, `/resumes`, `/events`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/jobs` | optional | Job listings |
| POST | `/job-applications` | ✓ | Apply to job |
| GET | `/job-applications` | ✓ | My applications |
| GET | `/resumes` | ✓ | My resumes |
| POST | `/resumes` | ✓ | Create resume |
| GET | `/events` | optional | Events list |
| POST | `/events/:id/register` | ✓ | Register for event |

---

## Notifications — `/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | ✓ | My notifications |
| PATCH | `/notifications/:id/read` | ✓ | Mark read |
| POST | `/notifications/read-all` | ✓ | Mark all read |

---

## Admin — `/admin`

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/admin/analytics/dashboard` | ✓ | SUPER_ADMIN |
| GET | `/admin/analytics/charts` | ✓ | SUPER_ADMIN |
| GET | `/admin/analytics/system` | ✓ | SUPER_ADMIN |
| GET | `/admin/analytics/live` | ✓ | SUPER_ADMIN |
| GET | `/admin/users` | ✓ | SUPER_ADMIN |
| PATCH | `/admin/users/:id` | ✓ | SUPER_ADMIN |
| GET | `/admin/managers` | ✓ | SUPER_ADMIN |
| POST | `/admin/invite-manager` | ✓ | SUPER_ADMIN |

---

## Admin Learning — `/admin/learning`

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/admin/learning/dashboard` | ✓ | SUPER_ADMIN |
| GET | `/admin/learning/courses` | ✓ | SUPER_ADMIN |
| POST | `/admin/learning/courses` | ✓ | SUPER_ADMIN |
| PUT | `/admin/learning/courses/:id` | ✓ | SUPER_ADMIN |
| DELETE | `/admin/learning/courses/:id` | ✓ | SUPER_ADMIN |
| GET | `/admin/learning/levels` | ✓ | SUPER_ADMIN |
| POST | `/admin/learning/levels` | ✓ | SUPER_ADMIN |
| PATCH | `/admin/learning/levels/:id` | ✓ | SUPER_ADMIN |
| DELETE | `/admin/learning/levels/:id` | ✓ | SUPER_ADMIN |
| GET | `/admin/learning/content` | ✓ | SUPER_ADMIN |
| POST | `/admin/learning/content` | ✓ | SUPER_ADMIN |
| PUT | `/admin/learning/content/:id` | ✓ | SUPER_ADMIN |
| DELETE | `/admin/learning/content/:id` | ✓ | SUPER_ADMIN |
| POST | `/admin/learning/content/:id/publish` | ✓ | SUPER_ADMIN |
| POST | `/admin/learning/content/:id/unpublish` | ✓ | SUPER_ADMIN |
| POST | `/admin/learning/content/:id/notes` | ✓ | SUPER_ADMIN |
| DELETE | `/admin/learning/notes/:noteId` | ✓ | SUPER_ADMIN |

---

## Manager — `/manager`

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/manager/dashboard` | ✓ | MANAGER |
| GET | `/manager/learning` | ✓ | MANAGER + LEARNING permission |
| GET | `/manager/coding` | ✓ | MANAGER + CODING permission |
| GET | `/manager/placements` | ✓ | MANAGER + PLACEMENTS permission |
| GET | `/manager/events` | ✓ | MANAGER + EVENTS permission |
| GET | `/manager/notifications` | ✓ | MANAGER + NOTIFICATIONS permission |

---

## Standard Response Shape

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": null
}
```

HTTP status codes: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`.

---

## Pagination (where supported)

Query params: `?page=1&limit=20`  
Response includes: `{ data: [], total, page, limit }`  
Max limit: 100 (enforced server-side).
