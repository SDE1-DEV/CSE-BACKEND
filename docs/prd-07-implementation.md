# PRD-07 Implementation — Role Management, Manager Console & Super Admin Platform

## Overview

PRD-07 extends the platform from a single-tier `ADMIN` model to a full three-role hierarchy:

```
SUPER_ADMIN
    │
    ├── Managers (content managers with per-module permissions)
    │
    └── Students (consumers)
```

---

## Roles

| Role | Purpose | Can Do |
|------|---------|--------|
| `STUDENT` | Consume content | Learning, Coding, Projects, Placements, Resume, Events, Notifications, Personal Analytics |
| `MANAGER` | Manage educational content | Create/Edit/Delete/Publish/Archive content in permitted modules |
| `SUPER_ADMIN` | Control entire platform | Everything — users, managers, permissions, analytics, settings, audit logs, reports |

---

## Database Changes

### New Prisma Models

| Model | Purpose |
|-------|---------|
| `ManagerPermission` | Per-module CRUD+Publish flags for each manager |
| `AuditLog` | Immutable record of every privileged action |
| `RoleHistory` | Tracks every role change (who, from→to, reason, when) |
| `ManagerInvitation` | Token-based invitation flow for promoting users to Manager |
| `PlatformMetric` | Daily platform snapshot (users, submissions, etc.) |
| `SystemLog` | Application-level system event logs |

### Updated Enum

```prisma
enum Role {
  STUDENT
  MENTOR      // legacy — backward compat
  ADMIN       // legacy — backward compat
  MANAGER     // NEW PRD-07
  SUPER_ADMIN // NEW PRD-07
}

enum PermissionModule {
  LEARNING | CODING | PROJECTS | PLACEMENTS | EVENTS | NOTIFICATIONS | REPORTS
}
```

---

## Middleware

| File | Purpose |
|------|---------|
| `role.middleware.ts` | Updated — `requireSuperAdmin`, `requireManager` added. `requireAdmin` now includes `SUPER_ADMIN`. |
| `permission.middleware.ts` | NEW — `requirePermission(module, action?)` — checks JWT permissions array + DB flags |
| `audit.middleware.ts` | NEW — `auditAction(opts)` — fires AuditLog entry after every privileged response |

### Permission Middleware Logic

```
SUPER_ADMIN  → bypass all checks
MANAGER      → check JWT permissions[] for module
             → check DB ManagerPermission.can{Action} flag
             → HTTP method maps to action: GET=read, POST=create, PUT/PATCH=update, DELETE=delete
             → explicit 'publish' action via requirePublishPermission()
Other roles  → 403 Forbidden
```

---

## JWT Token

After PRD-07, the JWT payload for a `MANAGER` includes their permissions:

```json
{
  "userId": "...",
  "role": "MANAGER",
  "permissions": ["LEARNING", "PROJECTS", "EVENTS"],
  "iat": 1234567890,
  "exp": 1234568790
}
```

`SUPER_ADMIN` and `STUDENT` tokens do not include a `permissions` array.

---

## API Routes

### Super Admin — `/api/admin/*` (SUPER_ADMIN only)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard` | Platform dashboard with user/content counts |
| GET | `/admin/users` | Paginated user list with filters |
| GET | `/admin/users/:id` | User detail with role history & permissions |
| PATCH | `/admin/users/:id` | Update user fields |
| DELETE | `/admin/users/:id` | Delete user |
| PATCH | `/admin/users/:id/status` | Toggle user verification |
| POST | `/admin/users/:id/promote` | Promote Student → Manager |
| POST | `/admin/users/:id/demote` | Demote Manager → Student |
| GET | `/admin/users/:id/role-history` | Role change history |
| GET | `/admin/managers` | All managers with permissions |
| GET | `/admin/managers/:id` | Manager detail |
| PUT | `/admin/managers/:id/permissions` | Update manager module permissions |
| GET | `/admin/analytics` | Platform-wide analytics |
| GET | `/admin/settings` | Platform settings |
| PUT | `/admin/settings` | Update platform settings |
| GET | `/admin/audit` | Audit log with filters (role, date, action, module, user) |
| GET | `/admin/reports` | Platform reports |
| POST | `/admin/metrics/snapshot` | Trigger daily metric snapshot |
| GET | `/admin/system-logs` | System logs with filters |
| POST | `/admin/invitations` | Send manager invitation email |
| POST | `/admin/invitations/:token/accept` | Accept manager invitation |

### Manager — `/api/manager/*` (MANAGER or SUPER_ADMIN)

| Method | Path | Permission Required |
|--------|------|-------------------|
| GET | `/manager/dashboard` | any |
| POST/PATCH/DELETE | `/manager/learning/*` | LEARNING |
| PATCH | `/manager/learning/roadmaps/:id/publish` | LEARNING + canPublish |
| POST/PUT/DELETE | `/manager/problems` | CODING |
| PATCH | `/manager/problems/:id/publish` | CODING + canPublish |
| POST/PUT/DELETE | `/manager/projects` | PROJECTS |
| POST/PUT/DELETE | `/manager/placements/*` | PLACEMENTS |
| POST/PUT/DELETE | `/manager/events` | EVENTS |
| POST/PUT/DELETE | `/manager/notifications` | NOTIFICATIONS |
| POST | `/manager/notifications/broadcast` | NOTIFICATIONS |
| GET | `/manager/reports` | REPORTS |
| POST | `/manager/content/bulk-publish` | varies by entity |
| POST | `/manager/content/bulk-archive` | varies by entity |
| POST | `/manager/content/bulk-delete` | varies by entity |

---

## Audit Events Recorded Automatically

Every call to `auditLogRepository.create()` in services captures:

- `ROADMAP_CREATED`, `ROADMAP_DELETED`, `ROADMAP_UPDATED`
- `LESSON_CREATED`, `LESSON_UPDATED`
- `CODING_PROBLEM_CREATED`, `CODING_PROBLEM_DELETED`, `CODING_PROBLEM_UPDATED`
- `PROJECT_CREATED`, `PROJECT_UPDATED`, `PROJECT_DELETED`
- `COMPANY_ADDED`, `JOB_POSTED`
- `EVENT_CREATED`, `NOTIFICATION_SENT`
- `USER_PROMOTED`, `USER_DEMOTED`, `USER_DELETED`, `USER_VERIFIED`
- `PERMISSION_UPDATED`, `SETTINGS_CHANGED`
- `BULK_PUBLISHED`, `BULK_ARCHIVED`, `BULK_DELETED`
- `MANAGER_INVITATION_SENT`
- `CONTENT_PUBLISHED`, `CONTENT_ARCHIVED`

---

## Scheduled Jobs Added

| Job Name | Schedule | Description |
|----------|----------|-------------|
| `metrics:daily-snapshot` | `55 23 * * *` | Daily platform metric snapshot |
| `invitations:expire-manager` | `0 * * * *` | Expire pending manager invitations |

---

## Security Constraints

- Managers **cannot** access `/admin/*` endpoints
- Managers **cannot** promote/demote users
- Managers **cannot** modify platform settings
- Managers **cannot** view monitoring or database
- `SUPER_ADMIN` cannot be deleted, demoted, or role-changed via any API
- Only one `SUPER_ADMIN` — promoted via `npx ts-node prisma/promote-admin.ts`
- All audit logs are immutable (append-only, no update/delete endpoints)

---

## Performance

- Dashboard metrics cached in Redis (TTL: 5 minutes)
- Manager dashboard cached per-manager (TTL: 5 minutes)
- All list endpoints paginated
- Bulk publish/archive/delete supported
- DB indexes on: `managerId`, `module`, `createdAt`, `role`, `action`, `performedBy`

---

## Backward Compatibility

- PRD-01 to PRD-06 APIs continue working unchanged
- `requireAdmin` now accepts both `ADMIN` and `SUPER_ADMIN` roles
- `requireStudent` accepts all roles including `MANAGER` and `SUPER_ADMIN`
- Old `/admin/*` routes (PRD-05) still work alongside new super-admin routes
- `MENTOR` and `ADMIN` roles still exist in enum for legacy data

---

## First-time Setup

To create the SUPER_ADMIN account:

```bash
npx ts-node prisma/promote-admin.ts your-email@example.com SUPER_ADMIN
```

To create a MANAGER:
```bash
npx ts-node prisma/promote-admin.ts manager@example.com MANAGER
# OR via API:
POST /api/admin/users/:id/promote
# OR via invitation:
POST /api/admin/invitations  { "email": "manager@example.com" }
```
