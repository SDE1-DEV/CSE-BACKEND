import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import healthRoutes from './health.routes';
import categoryRoutes from './category.routes';
import roadmapRoutes from './roadmap.routes';
import sectionRoutes from './section.routes';
import resourceRoutes from './resource.routes';
import searchRoutes from './search.routes';
import lessonRoutes from './lesson.routes';
import noteRoutes from './note.routes';
import learningRoutes from './learning.routes';
import learningApiRoutes from './learning-api.routes';

// ── PRD-03: Coding Practice Platform ─────────────────────────────────────────
import problemCategoryRoutes from './problem-category.routes';
import codingProblemRoutes from './coding-problem.routes';
import testCaseRoutes from './test-case.routes';
import codeTemplateRoutes from './code-template.routes';
import submissionRoutes from './submission.routes';
import tagRoutes from './tag.routes';
import companyRoutes from './company.routes';
import favoriteRoutes from './favorite.routes';
import dailyChallengeRoutes from './daily-challenge.routes';
import discussionRoutes from './discussion.routes';
import codingSearchRoutes from './coding-search.routes';
import { getCodingStats } from '../controllers/submission.controller';

// ── PRD-04: Project Hub & Team Collaboration ──────────────────────────────────
import projectCategoryRoutes from './project-category.routes';
import projectTechnologyRoutes from './project-technology.routes';
import projectHubRoutes from './project-hub.routes';
import teamRoutes from './team.routes';
import teamInvitationRoutes from './team-invitation.routes';
import taskRoutes from './task.routes';
import milestoneRoutes from './milestone.routes';
import projectFileRoutes from './project-file.routes';
import teamCommentRoutes from './team-comment.routes';
import projectDashboardRoutes from './project-dashboard.routes';
import { getMyTeams } from '../controllers/team.controller';
import { getTeamActivity } from '../controllers/activity-log.controller';

// ── PRD-05: Placement Ecosystem + Events + Notifications + Analytics + Admin ──
import jobPostingRoutes from './job-posting.routes';
import jobApplicationRoutes from './job-application.routes';
import resumeRoutes from './resume.routes';
import resumeSectionRoutes from './resume-section.routes';
import eventRoutes from './event.routes';
import notificationRoutes from './notification.routes';
import analyticsRoutes from './analytics.routes';
import adminRoutes from './admin.routes';
import { getMyEvents } from '../controllers/event.controller';

// ── PRD-07: Role Management, Manager Console & Super Admin ────────────────────
import superAdminRoutes from './super-admin.routes';
import managerRoutes from './manager.routes';
// /profile/* — alias for frontend profileService.ts (calls /profile, not /users/profile)
import profileRoutes from './profile.routes';

import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';

const router = Router();

// ── PRD-01: Auth & User ───────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);

router.use('/health', healthRoutes);

// ── PRD-02: Learning Ecosystem ────────────────────────────────────────────────
router.use('/categories', categoryRoutes);

// /learning/* — all frontend-facing learning API routes (quiz, practice, stats, notes, etc.)
// Mount FIRST so /learning/lessons/:id wins before generic /roadmaps CRUD
router.use('/learning', learningApiRoutes);

// Learning extras at root for backwards-compat (slug roadmaps, body bookmarks, progress, activity)
router.use('/', learningRoutes);

router.use('/roadmaps', roadmapRoutes);
router.use('/sections', sectionRoutes);
router.use('/resources', resourceRoutes);
router.use('/search', searchRoutes);

// Lesson routes mount directly on /api to preserve the exact URL structure
// from the PRD: /api/lessons/:sectionId, /api/lesson/:id, /api/bookmark/...
// /api/bookmarks, /api/recent, /api/learning/continue
router.use('/', lessonRoutes);

// Per-lesson Notes CRUD: /api/lesson/:id/notes (also at /api root)
router.use('/', noteRoutes);

// ── PRD-03: Coding Practice Platform ─────────────────────────────────────────
// /api/coding/* — all frontend-facing coding routes (matches codingService.ts paths)
// Must be mounted BEFORE the legacy /problems routes to avoid shadowing
import codingRoutes from './coding.routes';
router.use('/coding', codingRoutes);

// ── FPRD-17: Online Judge + Question Library ──────────────────────────────────
import judgeRoutes from './judge.routes';
import questionLibraryRoutes from './question-library.routes';
import datasetImportRoutes from './dataset-import.routes';
router.use('/judge', judgeRoutes);
router.use('/questions', questionLibraryRoutes);
router.use('/dataset-import', datasetImportRoutes);

router.use('/problem-categories', problemCategoryRoutes);
router.use('/problems', codingProblemRoutes);
router.use('/testcases', testCaseRoutes);
router.use('/templates', codeTemplateRoutes);
router.use('/submissions', submissionRoutes);
router.use('/tags', tagRoutes);
router.use('/companies', companyRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/daily-challenge', dailyChallengeRoutes);
router.use('/discussions', discussionRoutes);
router.use('/coding/search', codingSearchRoutes);
router.get('/stats/coding', authenticate, requireStudent, getCodingStats);

// ── PRD-04: Project Hub & Team Collaboration ──────────────────────────────────
router.use('/project-categories', projectCategoryRoutes);
router.use('/project-technologies', projectTechnologyRoutes);
router.use('/projects', projectHubRoutes);
router.use('/teams', teamRoutes);
router.use('/team-invitations', teamInvitationRoutes);
router.use('/tasks', taskRoutes);
router.use('/milestones', milestoneRoutes);
router.use('/project-files', projectFileRoutes);
router.use('/comments', teamCommentRoutes);
router.use('/dashboard', projectDashboardRoutes);

// GET /api/my-teams  — top-level shortcut
router.get('/my-teams', authenticate, requireStudent, getMyTeams);

// GET /api/teams/:id/activity  — co-mounted alongside team routes
router.get('/teams/:id/activity', authenticate, requireStudent, getTeamActivity);

// ── PRD-05: Placement Ecosystem ───────────────────────────────────────────────
router.use('/jobs', jobPostingRoutes);
router.use('/job-applications', jobApplicationRoutes);
router.use('/resumes', resumeRoutes);
router.use('/resume-sections', resumeSectionRoutes);
router.use('/events', eventRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);

// ── PRD-07: Super Admin routes FIRST (more specific) ─────────────────────────
// These handle /admin/dashboard, /admin/users/:id/promote, /admin/managers, etc.
router.use('/admin', superAdminRoutes);

// Legacy admin routes (backward compat PRD-01 to PRD-06)
router.use('/admin', adminRoutes);

// Manager Console — /api/manager/* (MANAGER or SUPER_ADMIN role required)
router.use('/manager', managerRoutes);

// FPRD-17 Phase 22 — Manager Problem/Judge Management
import managerProblemsRoutes from './manager-problems.routes';
router.use('/manager/judge', managerProblemsRoutes);

// GET /api/my-events — top-level shortcut
router.get('/my-events', authenticate, requireStudent, getMyEvents);

export default router;
