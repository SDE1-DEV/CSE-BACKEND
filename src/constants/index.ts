export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'Registration successful.',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  OTP_SENT: 'OTP sent to your email',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',

  // Profile
  PROFILE_FETCHED: 'Profile fetched successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PROFILE_IMAGE_UPLOADED: 'Profile image uploaded successfully',

  // Errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  INVALID_OTP: 'Invalid or expired OTP',
  EXPIRED_OTP: 'OTP has expired',
  TOKEN_INVALID: 'Invalid or expired token',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'You do not have permission to perform this action',
  USER_NOT_FOUND: 'User not found',
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'An internal server error occurred',
  HEALTH_OK: 'Server is running',
  SUPER_ADMIN_PROTECTED: 'The Super Admin account cannot be modified or deleted',

  // Upload
  FILE_UPLOAD_FAILED: 'File upload failed',
  INVALID_FILE_TYPE: 'Invalid file type. Only images are allowed',
  FILE_TOO_LARGE: 'File size exceeds the limit',
} as const;

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_LENGTH = 6;
export const BCRYPT_ROUNDS = 12;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const ROLES = {
  STUDENT: 'STUDENT',
  MANAGER: 'MANAGER',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

// ── PRD-07: Role Management Messages ─────────────────────────────────────────
export const ROLE_MESSAGES = {
  // Manager permissions
  PERMISSION_UPDATED: 'Manager permissions updated successfully',
  PERMISSION_FETCHED: 'Manager permissions fetched successfully',
  PERMISSION_NOT_FOUND: 'Manager permissions not found',

  // User role changes
  USER_PROMOTED: 'User promoted to Manager successfully',
  USER_DEMOTED: 'Manager demoted to Student successfully',
  CANNOT_PROMOTE_SUPER_ADMIN: 'Cannot promote/demote the Super Admin account',
  USER_ALREADY_MANAGER: 'User is already a Manager',
  USER_NOT_MANAGER: 'User is not a Manager',
  USER_STATUS_UPDATED: 'User status updated successfully',

  // Audit logs
  AUDIT_LOGS_FETCHED: 'Audit logs fetched successfully',

  // Role history
  ROLE_HISTORY_FETCHED: 'Role history fetched successfully',

  // Manager invitation
  INVITATION_SENT: 'Manager invitation sent successfully',
  INVITATION_INVALID: 'Invalid or expired invitation token',
  INVITATION_ACCEPTED: 'Invitation accepted. Account upgraded to Manager.',
  INVITATION_ALREADY_ACCEPTED: 'This invitation has already been accepted',

  // Manager dashboard
  MANAGER_DASHBOARD_FETCHED: 'Manager dashboard fetched successfully',

  // Admin dashboard
  SUPER_ADMIN_DASHBOARD_FETCHED: 'Super Admin dashboard fetched successfully',

  // Analytics
  PLATFORM_ANALYTICS_FETCHED: 'Platform analytics fetched successfully',

  // Platform metrics
  METRICS_FETCHED: 'Platform metrics fetched successfully',
  METRIC_SNAPSHOT_CREATED: 'Daily metric snapshot created successfully',

  // System logs
  SYSTEM_LOGS_FETCHED: 'System logs fetched successfully',

  // Reports
  REPORTS_EXPORTED: 'Report exported successfully',

  // Manager content
  CONTENT_PUBLISHED: 'Content published successfully',
  CONTENT_ARCHIVED: 'Content archived successfully',
  CONTENT_UNPUBLISHED: 'Content unpublished successfully',
  CONTENT_FORBIDDEN: 'You do not have permission to manage this content module',
} as const;

// ── Learning Ecosystem Messages ───────────────────────────────────────────────
export const LEARNING_MESSAGES = {
  // Categories
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: 'Category deleted successfully',
  CATEGORY_FETCHED: 'Category fetched successfully',
  CATEGORIES_FETCHED: 'Categories fetched successfully',
  CATEGORY_NOT_FOUND: 'Category not found',
  CATEGORY_SLUG_EXISTS: 'A category with this slug already exists',

  // Roadmaps
  ROADMAP_CREATED: 'Roadmap created successfully',
  ROADMAP_UPDATED: 'Roadmap updated successfully',
  ROADMAP_DELETED: 'Roadmap deleted successfully',
  ROADMAP_FETCHED: 'Roadmap fetched successfully',
  ROADMAPS_FETCHED: 'Roadmaps fetched successfully',
  ROADMAP_NOT_FOUND: 'Roadmap not found',
  ROADMAP_SLUG_EXISTS: 'A roadmap with this slug already exists',

  // Sections
  SECTION_CREATED: 'Section created successfully',
  SECTION_UPDATED: 'Section updated successfully',
  SECTION_DELETED: 'Section deleted successfully',
  SECTIONS_FETCHED: 'Sections fetched successfully',
  SECTION_NOT_FOUND: 'Section not found',

  // Lessons
  LESSON_CREATED: 'Lesson created successfully',
  LESSON_UPDATED: 'Lesson updated successfully',
  LESSON_DELETED: 'Lesson deleted successfully',
  LESSON_FETCHED: 'Lesson fetched successfully',
  LESSONS_FETCHED: 'Lessons fetched successfully',
  LESSON_NOT_FOUND: 'Lesson not found',
  LESSON_SLUG_EXISTS: 'A lesson with this slug already exists',

  // Resources
  RESOURCE_CREATED: 'Resource created successfully',
  RESOURCE_UPDATED: 'Resource updated successfully',
  RESOURCE_DELETED: 'Resource deleted successfully',
  RESOURCES_FETCHED: 'Resources fetched successfully',
  RESOURCE_NOT_FOUND: 'Resource not found',

  // Progress
  PROGRESS_UPDATED: 'Progress updated successfully',
  LESSON_COMPLETED: 'Lesson marked as complete',
  PROGRESS_FETCHED: 'Progress fetched successfully',

  // Bookmarks
  BOOKMARK_ADDED: 'Lesson bookmarked successfully',
  BOOKMARK_REMOVED: 'Bookmark removed successfully',
  BOOKMARKS_FETCHED: 'Bookmarks fetched successfully',
  BOOKMARK_EXISTS: 'Lesson is already bookmarked',
  BOOKMARK_NOT_FOUND: 'Bookmark not found',

  // Recently Viewed
  RECENTLY_VIEWED_FETCHED: 'Recently viewed lessons fetched successfully',

  // Continue Learning
  CONTINUE_LEARNING_FETCHED: 'Continue learning fetched successfully',

  // Search
  SEARCH_RESULTS_FETCHED: 'Search results fetched successfully',
} as const;

export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 100 },            // 100 per 15 min
  GENERAL: { windowMs: 15 * 60 * 1000, max: 100 },         // 100 per 15 min
  UPLOAD: { windowMs: 60 * 60 * 1000, max: 20 },           // 20 per hour
  SEARCH: { windowMs: 60 * 1000, max: 30 },                // 30 per min
  NOTIFICATIONS: { windowMs: 60 * 1000, max: 60 },         // 60 per min
  AI_ENDPOINTS: { windowMs: 60 * 1000, max: 10 },          // 10 per min (future)
} as const;

// ── PRD-06: Production Engineering Messages ───────────────────────────────────
export const PRD06_MESSAGES = {
  // Health
  HEALTH_OK: 'Server is healthy',
  HEALTH_DEGRADED: 'Server is degraded',
  CACHE_HEALTHY: 'Cache is healthy',
  CACHE_UNAVAILABLE: 'Cache is unavailable',
  QUEUE_OPERATIONAL: 'Queues are operational',

  // Cache
  CACHE_INVALIDATED: 'Cache invalidated successfully',

  // Jobs
  JOB_ENQUEUED: 'Job enqueued successfully',
  JOB_QUEUED_BACKGROUND: 'Operation queued for background processing',
} as const;

// ── Coding Practice Platform Messages (PRD-03) ────────────────────────────────
export const CODING_MESSAGES = {
  // Problem Categories
  PROBLEM_CATEGORY_CREATED: 'Problem category created successfully',
  PROBLEM_CATEGORY_UPDATED: 'Problem category updated successfully',
  PROBLEM_CATEGORY_DELETED: 'Problem category deleted successfully',
  PROBLEM_CATEGORY_FETCHED: 'Problem category fetched successfully',
  PROBLEM_CATEGORIES_FETCHED: 'Problem categories fetched successfully',
  PROBLEM_CATEGORY_NOT_FOUND: 'Problem category not found',
  PROBLEM_CATEGORY_SLUG_EXISTS: 'A problem category with this slug already exists',

  // Problems
  PROBLEM_CREATED: 'Problem created successfully',
  PROBLEM_UPDATED: 'Problem updated successfully',
  PROBLEM_DELETED: 'Problem deleted successfully',
  PROBLEM_FETCHED: 'Problem fetched successfully',
  PROBLEMS_FETCHED: 'Problems fetched successfully',
  PROBLEM_NOT_FOUND: 'Problem not found',
  PROBLEM_SLUG_EXISTS: 'A problem with this slug already exists',

  // Tags
  TAG_CREATED: 'Tag created successfully',
  TAG_UPDATED: 'Tag updated successfully',
  TAG_DELETED: 'Tag deleted successfully',
  TAGS_FETCHED: 'Tags fetched successfully',
  TAG_FETCHED: 'Tag fetched successfully',
  TAG_NOT_FOUND: 'Tag not found',
  TAG_SLUG_EXISTS: 'A tag with this slug already exists',
  TAG_NAME_EXISTS: 'A tag with this name already exists',

  // Companies
  COMPANY_CREATED: 'Company created successfully',
  COMPANY_UPDATED: 'Company updated successfully',
  COMPANY_DELETED: 'Company deleted successfully',
  COMPANIES_FETCHED: 'Companies fetched successfully',
  COMPANY_FETCHED: 'Company fetched successfully',
  COMPANY_NOT_FOUND: 'Company not found',
  COMPANY_SLUG_EXISTS: 'A company with this slug already exists',
  COMPANY_NAME_EXISTS: 'A company with this name already exists',

  // Test Cases
  TEST_CASE_CREATED: 'Test case created successfully',
  TEST_CASE_UPDATED: 'Test case updated successfully',
  TEST_CASE_DELETED: 'Test case deleted successfully',
  TEST_CASES_FETCHED: 'Test cases fetched successfully',
  TEST_CASE_NOT_FOUND: 'Test case not found',

  // Code Templates
  TEMPLATE_CREATED: 'Code template created successfully',
  TEMPLATE_UPDATED: 'Code template updated successfully',
  TEMPLATE_DELETED: 'Code template deleted successfully',
  TEMPLATES_FETCHED: 'Code templates fetched successfully',
  TEMPLATE_NOT_FOUND: 'Code template not found',
  TEMPLATE_LANGUAGE_EXISTS: 'A template for this language already exists for the problem',

  // Submissions
  SUBMISSION_CREATED: 'Solution submitted successfully',
  SUBMISSIONS_FETCHED: 'Submissions fetched successfully',
  SUBMISSION_FETCHED: 'Submission fetched successfully',
  SUBMISSION_NOT_FOUND: 'Submission not found',

  // Favorites
  FAVORITE_ADDED: 'Problem added to favorites',
  FAVORITE_REMOVED: 'Problem removed from favorites',
  FAVORITES_FETCHED: 'Favorite problems fetched successfully',
  FAVORITE_EXISTS: 'Problem is already in favorites',
  FAVORITE_NOT_FOUND: 'Favorite not found',

  // Daily Challenge
  DAILY_CHALLENGE_FETCHED: 'Daily challenge fetched successfully',
  DAILY_CHALLENGE_CREATED: 'Daily challenge created successfully',
  DAILY_CHALLENGE_UPDATED: 'Daily challenge updated successfully',
  DAILY_CHALLENGE_DELETED: 'Daily challenge deleted successfully',
  DAILY_CHALLENGE_NOT_FOUND: 'No daily challenge found for today',
  DAILY_CHALLENGE_DATE_EXISTS: 'A daily challenge already exists for this date',

  // Discussions
  DISCUSSION_CREATED: 'Discussion posted successfully',
  DISCUSSION_UPDATED: 'Discussion updated successfully',
  DISCUSSION_DELETED: 'Discussion deleted successfully',
  DISCUSSIONS_FETCHED: 'Discussions fetched successfully',
  DISCUSSION_NOT_FOUND: 'Discussion not found',
  DISCUSSION_FORBIDDEN: 'You can only edit or delete your own discussions',

  // Stats
  CODING_STATS_FETCHED: 'Coding statistics fetched successfully',

  // Search
  CODING_SEARCH_FETCHED: 'Search results fetched successfully',
} as const;

// ── Project Hub & Team Collaboration Messages (PRD-04) ────────────────────────
export const PROJECT_MESSAGES = {
  // Project Categories
  PROJECT_CATEGORY_CREATED: 'Project category created successfully',
  PROJECT_CATEGORY_UPDATED: 'Project category updated successfully',
  PROJECT_CATEGORY_DELETED: 'Project category deleted successfully',
  PROJECT_CATEGORY_FETCHED: 'Project category fetched successfully',
  PROJECT_CATEGORIES_FETCHED: 'Project categories fetched successfully',
  PROJECT_CATEGORY_NOT_FOUND: 'Project category not found',
  PROJECT_CATEGORY_SLUG_EXISTS: 'A project category with this slug already exists',

  // Projects
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  PROJECT_FETCHED: 'Project fetched successfully',
  PROJECTS_FETCHED: 'Projects fetched successfully',
  PROJECT_NOT_FOUND: 'Project not found',
  PROJECT_SLUG_EXISTS: 'A project with this slug already exists',

  // Technologies
  TECHNOLOGY_CREATED: 'Technology created successfully',
  TECHNOLOGY_UPDATED: 'Technology updated successfully',
  TECHNOLOGY_DELETED: 'Technology deleted successfully',
  TECHNOLOGY_FETCHED: 'Technology fetched successfully',
  TECHNOLOGIES_FETCHED: 'Technologies fetched successfully',
  TECHNOLOGY_NOT_FOUND: 'Technology not found',
  TECHNOLOGY_SLUG_EXISTS: 'A technology with this slug already exists',
  TECHNOLOGY_NAME_EXISTS: 'A technology with this name already exists',
  TECHNOLOGY_ADDED: 'Technology added to project successfully',
  TECHNOLOGY_REMOVED: 'Technology removed from project successfully',
  TECHNOLOGY_ALREADY_ADDED: 'Technology is already added to this project',

  // Teams
  TEAM_CREATED: 'Team created successfully',
  TEAM_UPDATED: 'Team updated successfully',
  TEAM_DELETED: 'Team deleted successfully',
  TEAM_FETCHED: 'Team fetched successfully',
  TEAMS_FETCHED: 'Teams fetched successfully',
  MY_TEAMS_FETCHED: 'My teams fetched successfully',
  TEAM_NOT_FOUND: 'Team not found',
  TEAM_FULL: 'Team is full',
  TEAM_CLOSED: 'Team is closed',
  TEAM_ALREADY_MEMBER: 'You are already a member of this team',
  TEAM_NOT_MEMBER: 'You are not a member of this team',
  TEAM_ONLY_OWNER_DELETE: 'Only the team owner can delete this team',

  // Invitations
  INVITATION_SENT: 'Invitation sent successfully',
  INVITATION_UPDATED: 'Invitation updated successfully',
  INVITATION_FETCHED: 'Invitation fetched successfully',
  INVITATIONS_FETCHED: 'Invitations fetched successfully',
  INVITATION_NOT_FOUND: 'Invitation not found',
  INVITATION_EXPIRED: 'Invitation has expired',
  INVITATION_ALREADY_SENT: 'An invitation has already been sent to this user',
  INVITATION_ONLY_OWNER_LEADER: 'Only owners or leaders can send invitations',
  INVITATION_FORBIDDEN: 'You cannot update this invitation',
  INVITATION_ACCEPTED: 'Invitation accepted successfully',
  INVITATION_REJECTED: 'Invitation rejected successfully',

  // Members
  MEMBER_ADDED: 'Member added successfully',
  MEMBER_REMOVED: 'Member removed successfully',
  MEMBER_UPDATED: 'Member role updated successfully',
  MEMBERS_FETCHED: 'Team members fetched successfully',
  MEMBER_NOT_FOUND: 'Member not found',

  // Tasks
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_DELETED: 'Task deleted successfully',
  TASK_FETCHED: 'Task fetched successfully',
  TASKS_FETCHED: 'Tasks fetched successfully',
  TASK_NOT_FOUND: 'Task not found',
  TASK_IMMUTABLE: 'Completed tasks cannot be modified unless reopened by owner or leader',
  TASK_FORBIDDEN: 'You do not have permission to modify this task',

  // Milestones
  MILESTONE_CREATED: 'Milestone created successfully',
  MILESTONE_UPDATED: 'Milestone updated successfully',
  MILESTONE_DELETED: 'Milestone deleted successfully',
  MILESTONE_FETCHED: 'Milestone fetched successfully',
  MILESTONES_FETCHED: 'Milestones fetched successfully',
  MILESTONE_NOT_FOUND: 'Milestone not found',

  // Files
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DELETED: 'File deleted successfully',
  FILES_FETCHED: 'Project files fetched successfully',
  FILE_NOT_FOUND: 'File not found',
  FILE_UPLOAD_FAILED: 'File upload to storage failed',

  // Comments
  COMMENT_CREATED: 'Comment added successfully',
  COMMENT_UPDATED: 'Comment updated successfully',
  COMMENT_DELETED: 'Comment deleted successfully',
  COMMENTS_FETCHED: 'Comments fetched successfully',
  COMMENT_NOT_FOUND: 'Comment not found',
  COMMENT_FORBIDDEN: 'You can only edit or delete your own comments',

  // Activity
  ACTIVITY_FETCHED: 'Activity log fetched successfully',

  // Dashboard
  DASHBOARD_FETCHED: 'Dashboard data fetched successfully',
} as const;

// ── Placement Ecosystem Messages (PRD-05) ─────────────────────────────────────
export const PLACEMENT_MESSAGES = {
  // Companies (extended)
  COMPANY_EXTENDED: 'Company extended with placement fields',

  // Jobs
  JOB_CREATED: 'Job posting created successfully',
  JOB_UPDATED: 'Job posting updated successfully',
  JOB_DELETED: 'Job posting deleted successfully',
  JOB_FETCHED: 'Job posting fetched successfully',
  JOBS_FETCHED: 'Job postings fetched successfully',
  JOB_NOT_FOUND: 'Job posting not found',

  // Applications
  APPLICATION_CREATED: 'Application tracked successfully',
  APPLICATION_UPDATED: 'Application updated successfully',
  APPLICATION_DELETED: 'Application removed successfully',
  APPLICATIONS_FETCHED: 'Applications fetched successfully',
  APPLICATION_NOT_FOUND: 'Application not found',
  APPLICATION_ALREADY_EXISTS: 'You have already applied for this job',
  APPLICATION_FORBIDDEN: 'You can only manage your own applications',

  // Resumes
  RESUME_CREATED: 'Resume created successfully',
  RESUME_UPDATED: 'Resume updated successfully',
  RESUME_DELETED: 'Resume deleted successfully',
  RESUME_FETCHED: 'Resume fetched successfully',
  RESUMES_FETCHED: 'Resumes fetched successfully',
  RESUME_NOT_FOUND: 'Resume not found',
  RESUME_FORBIDDEN: 'You can only manage your own resumes',
  RESUME_DEFAULT_SET: 'Default resume updated successfully',

  // Resume Sections
  RESUME_SECTION_CREATED: 'Resume section created successfully',
  RESUME_SECTION_UPDATED: 'Resume section updated successfully',
  RESUME_SECTION_DELETED: 'Resume section deleted successfully',
  RESUME_SECTION_NOT_FOUND: 'Resume section not found',
  RESUME_SECTION_FORBIDDEN: 'You can only manage your own resume sections',

  // Events
  EVENT_CREATED: 'Event created successfully',
  EVENT_UPDATED: 'Event updated successfully',
  EVENT_DELETED: 'Event deleted successfully',
  EVENT_FETCHED: 'Event fetched successfully',
  EVENTS_FETCHED: 'Events fetched successfully',
  EVENT_NOT_FOUND: 'Event not found',

  // Event Registration
  EVENT_REGISTERED: 'Registered for event successfully',
  EVENT_UNREGISTERED: 'Event registration cancelled successfully',
  MY_EVENTS_FETCHED: 'My events fetched successfully',
  EVENT_ALREADY_REGISTERED: 'You are already registered for this event',
  EVENT_NOT_REGISTERED: 'You are not registered for this event',
  EVENT_FULL: 'Event has reached maximum participants',

  // Notifications
  NOTIFICATIONS_FETCHED: 'Notifications fetched successfully',
  NOTIFICATION_READ: 'Notification marked as read',
  NOTIFICATIONS_READ_ALL: 'All notifications marked as read',
  NOTIFICATION_DELETED: 'Notification deleted successfully',
  NOTIFICATION_NOT_FOUND: 'Notification not found',
  NOTIFICATION_FORBIDDEN: 'You can only manage your own notifications',

  // Analytics
  ANALYTICS_FETCHED: 'Analytics fetched successfully',

  // Admin
  ADMIN_DASHBOARD_FETCHED: 'Admin dashboard fetched successfully',
  ADMIN_REPORTS_FETCHED: 'Reports fetched successfully',
  SETTINGS_FETCHED: 'Settings fetched successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
  SETTING_NOT_FOUND: 'Setting not found',
} as const;
