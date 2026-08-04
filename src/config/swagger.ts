import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CAMPUSRANK API',
      version: '7.0.0',
      description:
        'Backend API for CAMPUSRANK — Authentication, User Management, Learning Ecosystem, Coding Practice Platform, Project Hub / Team Collaboration, Placement Ecosystem, and Role Management / Manager Console / Super Admin Platform.',
      contact: {
        name: 'CAMPUSRANK',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development Server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & token management' },
      { name: 'Users', description: 'User profile & account management' },
      { name: 'Categories', description: 'Learning roadmap categories' },
      { name: 'Roadmaps', description: 'Learning roadmaps' },
      { name: 'Sections', description: 'Roadmap sections' },
      { name: 'Lessons', description: 'Individual lessons' },
      { name: 'Resources', description: 'Lesson resources' },
      { name: 'Problems', description: 'Coding problems' },
      { name: 'Submissions', description: 'Code submissions' },
      { name: 'Projects', description: 'Project hub' },
      { name: 'Teams', description: 'Team collaboration' },
      { name: 'Events', description: 'Platform events' },
      { name: 'Jobs', description: 'Job postings' },
      { name: 'Notifications', description: 'User notifications' },
      { name: 'Analytics', description: 'Personal analytics' },
      { name: 'Admin', description: 'Legacy admin (PRD-01 to PRD-06, ADMIN role)' },
      // PRD-07
      {
        name: 'Super Admin',
        description:
          'PRD-07 — Super Admin platform control. **Requires SUPER_ADMIN role.** ' +
          'Full platform access: users, managers, permissions, analytics, settings, audit logs, reports.',
      },
      {
        name: 'Manager',
        description:
          'PRD-07 — Manager content console. **Requires MANAGER or SUPER_ADMIN role.** ' +
          'Manages educational content per assigned module permissions. ' +
          'Cannot access user management, platform settings, or admin APIs.',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        // ── Generic Responses ───────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
            errors: { type: 'null', example: null },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation Failed' },
            data: { type: 'null', example: null },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            total: { type: 'integer', example: 50 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 5 },
          },
        },

        // ── Auth Schemas ────────────────────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['fullName', 'email', 'password'],
          properties: {
            fullName: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', minLength: 8, example: 'Password@123' },
            phoneNumber: { type: 'string', example: '9876543210' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'Password@123' },
          },
        },
        VerifyEmailRequest: {
          type: 'object',
          required: ['email', 'otp'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            otp: { type: 'string', example: '123456' },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['email', 'otp', 'newPassword'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            otp: { type: 'string', example: '123456' },
            newPassword: { type: 'string', minLength: 8, example: 'NewPassword@123' },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            fullName: { type: 'string', example: 'John Doe' },
            phoneNumber: { type: 'string', example: '9876543210' },
            bio: { type: 'string', example: 'Passionate developer' },
            collegeName: { type: 'string', example: 'ABC Engineering College' },
            university: { type: 'string', example: 'XYZ University' },
            branch: { type: 'string', example: 'Computer Science' },
            semester: { type: 'integer', example: 5 },
            currentYear: { type: 'integer', example: 3 },
            githubUrl: { type: 'string', example: 'https://github.com/johndoe' },
            linkedinUrl: { type: 'string', example: 'https://linkedin.com/in/johndoe' },
            portfolioUrl: { type: 'string', example: 'https://johndoe.dev' },
          },
        },

        // ── Category Schemas ────────────────────────────────────────────────
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Web Development' },
            slug: { type: 'string', example: 'web-development' },
            description: { type: 'string', nullable: true },
            icon: { type: 'string', nullable: true },
            displayOrder: { type: 'integer', example: 1 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateCategoryRequest: {
          type: 'object',
          required: ['title', 'slug'],
          properties: {
            title: { type: 'string', example: 'Web Development' },
            slug: { type: 'string', example: 'web-development' },
            description: { type: 'string', nullable: true },
            icon: { type: 'string', nullable: true, example: '🌐' },
            displayOrder: { type: 'integer', example: 1, default: 0 },
            isActive: { type: 'boolean', example: true, default: true },
          },
        },

        // ── Roadmap Schemas ─────────────────────────────────────────────────
        Roadmap: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            categoryId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Python Roadmap' },
            slug: { type: 'string', example: 'python-roadmap' },
            description: { type: 'string', nullable: true },
            thumbnail: { type: 'string', nullable: true },
            difficulty: {
              type: 'string',
              enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
              example: 'BEGINNER',
            },
            estimatedHours: { type: 'integer', nullable: true, example: 40 },
            prerequisites: { type: 'string', nullable: true },
            displayOrder: { type: 'integer', example: 1 },
            isPublished: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateRoadmapRequest: {
          type: 'object',
          required: ['categoryId', 'title', 'slug'],
          properties: {
            categoryId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Python Roadmap' },
            slug: { type: 'string', example: 'python-roadmap' },
            description: { type: 'string', nullable: true },
            thumbnail: { type: 'string', format: 'uri', nullable: true },
            difficulty: {
              type: 'string',
              enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
              default: 'BEGINNER',
            },
            estimatedHours: { type: 'integer', nullable: true, minimum: 1 },
            prerequisites: { type: 'string', nullable: true },
            displayOrder: { type: 'integer', default: 0 },
            isPublished: { type: 'boolean', default: false },
          },
        },

        // ── Section Schemas ─────────────────────────────────────────────────
        RoadmapSection: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            roadmapId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Python Basics' },
            description: { type: 'string', nullable: true },
            order: { type: 'integer', example: 1 },
          },
        },
        CreateSectionRequest: {
          type: 'object',
          required: ['roadmapId', 'title'],
          properties: {
            roadmapId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Python Basics' },
            description: { type: 'string', nullable: true },
            order: { type: 'integer', default: 0 },
          },
        },

        // ── Lesson Schemas ──────────────────────────────────────────────────
        Lesson: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sectionId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Introduction to Python' },
            slug: { type: 'string', example: 'intro-to-python' },
            description: { type: 'string', nullable: true },
            contentType: {
              type: 'string',
              enum: ['NOTE', 'VIDEO', 'ARTICLE', 'QUIZ', 'ASSIGNMENT', 'PROJECT', 'CODING_PROBLEM'],
              example: 'VIDEO',
            },
            estimatedMinutes: { type: 'integer', nullable: true, example: 30 },
            order: { type: 'integer', example: 1 },
            isPublished: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateLessonRequest: {
          type: 'object',
          required: ['sectionId', 'title', 'slug'],
          properties: {
            sectionId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Introduction to Python' },
            slug: { type: 'string', example: 'intro-to-python' },
            description: { type: 'string', nullable: true },
            contentType: {
              type: 'string',
              enum: ['NOTE', 'VIDEO', 'ARTICLE', 'QUIZ', 'ASSIGNMENT', 'PROJECT', 'CODING_PROBLEM'],
              default: 'NOTE',
            },
            estimatedMinutes: { type: 'integer', nullable: true, minimum: 1 },
            order: { type: 'integer', default: 0 },
            isPublished: { type: 'boolean', default: false },
          },
        },

        // ── Resource Schemas ────────────────────────────────────────────────
        LearningResource: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            lessonId: { type: 'string', format: 'uuid' },
            type: {
              type: 'string',
              enum: ['PDF', 'VIDEO', 'ARTICLE', 'GITHUB', 'DOCUMENTATION', 'PRACTICE_LINK'],
            },
            title: { type: 'string', example: 'Python Official Docs' },
            url: { type: 'string', format: 'uri' },
            duration: { type: 'integer', nullable: true, example: 1200 },
            author: { type: 'string', nullable: true },
            thumbnail: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateResourceRequest: {
          type: 'object',
          required: ['lessonId', 'type', 'title', 'url'],
          properties: {
            lessonId: { type: 'string', format: 'uuid' },
            type: {
              type: 'string',
              enum: ['PDF', 'VIDEO', 'ARTICLE', 'GITHUB', 'DOCUMENTATION', 'PRACTICE_LINK'],
            },
            title: { type: 'string', example: 'Python Official Docs' },
            url: { type: 'string', format: 'uri', example: 'https://docs.python.org' },
            duration: { type: 'integer', nullable: true, minimum: 1, example: 1200 },
            author: { type: 'string', nullable: true },
            thumbnail: { type: 'string', format: 'uri', nullable: true },
          },
        },

        // ── Progress Schemas ────────────────────────────────────────────────
        LessonProgress: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            lessonId: { type: 'string', format: 'uuid' },
            completed: { type: 'boolean', example: false },
            completedAt: { type: 'string', format: 'date-time', nullable: true },
            percentage: { type: 'number', example: 65 },
            timeSpent: { type: 'integer', example: 420 },
          },
        },
        UpdateProgressRequest: {
          type: 'object',
          required: ['watchPercentage', 'timeSpent'],
          properties: {
            watchPercentage: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 65,
            },
            timeSpent: {
              type: 'integer',
              minimum: 0,
              example: 420,
              description: 'Additional seconds spent (will be accumulated)',
            },
          },
        },

        // ── Bookmark Schemas ────────────────────────────────────────────────
        Bookmark: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            lessonId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── PRD-03: Coding Practice Platform Schemas ────────────────────────

        // Problem Categories
        CreateProblemCategoryRequest: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            name: { type: 'string', example: 'Arrays' },
            slug: { type: 'string', example: 'arrays' },
            description: { type: 'string', nullable: true },
            displayOrder: { type: 'integer', default: 0 },
            isActive: { type: 'boolean', default: true },
          },
        },

        // Coding Problem
        CreateCodingProblemRequest: {
          type: 'object',
          required: ['categoryId', 'title', 'slug', 'problemStatement'],
          properties: {
            categoryId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Two Sum' },
            slug: { type: 'string', example: 'two-sum' },
            description: { type: 'string', nullable: true },
            problemStatement: { type: 'string', example: 'Given an array of integers...' },
            inputFormat: { type: 'string', nullable: true },
            outputFormat: { type: 'string', nullable: true },
            constraints: { type: 'string', nullable: true },
            sampleInput: { type: 'string', nullable: true },
            sampleOutput: { type: 'string', nullable: true },
            explanation: { type: 'string', nullable: true },
            difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'], default: 'EASY' },
            timeLimit: { type: 'integer', default: 1000, description: 'Time limit in milliseconds' },
            memoryLimit: { type: 'integer', default: 256, description: 'Memory limit in MB' },
            points: { type: 'integer', default: 0 },
            isPublished: { type: 'boolean', default: false },
          },
        },

        // Test Case
        CreateTestCaseRequest: {
          type: 'object',
          required: ['problemId', 'input', 'expectedOutput'],
          properties: {
            problemId: { type: 'string', format: 'uuid' },
            input: { type: 'string', example: '[2,7,11,15]\n9' },
            expectedOutput: { type: 'string', example: '[0,1]' },
            isSample: { type: 'boolean', default: false },
            isHidden: { type: 'boolean', default: false },
            weight: { type: 'integer', default: 1 },
          },
        },

        // Code Template
        CreateCodeTemplateRequest: {
          type: 'object',
          required: ['problemId', 'language', 'template'],
          properties: {
            problemId: { type: 'string', format: 'uuid' },
            language: { type: 'string', enum: ['C', 'CPP', 'JAVA', 'PYTHON', 'JAVASCRIPT'] },
            template: { type: 'string', example: 'def twoSum(nums, target):\n    pass' },
          },
        },

        // Submission
        CreateSubmissionRequest: {
          type: 'object',
          required: ['problemId', 'language', 'sourceCode'],
          properties: {
            problemId: { type: 'string', format: 'uuid' },
            language: { type: 'string', enum: ['C', 'CPP', 'JAVA', 'PYTHON', 'JAVASCRIPT'] },
            sourceCode: { type: 'string', example: 'def twoSum(nums, target):\n    ...' },
          },
        },

        // Tag
        CreateTagRequest: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            name: { type: 'string', example: 'Binary Search' },
            slug: { type: 'string', example: 'binary-search' },
          },
        },

        // Company
        CreateCompanyRequest: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            name: { type: 'string', example: 'Google' },
            slug: { type: 'string', example: 'google' },
            logo: { type: 'string', format: 'uri', nullable: true },
            website: { type: 'string', format: 'uri', nullable: true, example: 'https://google.com' },
          },
        },

        // Daily Challenge
        CreateDailyChallengeRequest: {
          type: 'object',
          required: ['problemId', 'challengeDate'],
          properties: {
            problemId: { type: 'string', format: 'uuid' },
            challengeDate: { type: 'string', example: '2026-07-15' },
            bonusXP: { type: 'integer', default: 50 },
          },
        },

        // Discussion
        CreateDiscussionRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: 'Here is my approach to solving this...' },
          },
        },

        // Coding Stats
        CodingStatsResponse: {
          type: 'object',
          properties: {
            totalSolved: { type: 'integer', example: 42 },
            easySolved: { type: 'integer', example: 20 },
            mediumSolved: { type: 'integer', example: 15 },
            hardSolved: { type: 'integer', example: 7 },
            totalSubmissions: { type: 'integer', example: 100 },
            acceptedSubmissions: { type: 'integer', example: 42 },
            acceptanceRate: { type: 'number', example: 42.0 },
            averageRuntime: { type: 'number', example: 128.5 },
            favoriteLanguage: { type: 'string', nullable: true, example: 'PYTHON' },
            currentStreak: { type: 'integer', example: 5 },
            longestStreak: { type: 'integer', example: 14 },
          },
        },

        // ── PRD-04: Project Hub & Team Collaboration Schemas ────────────────

        // Project Category
        CreateProjectCategoryRequest: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            name: { type: 'string', example: 'Web Development' },
            slug: { type: 'string', example: 'web-development' },
            description: { type: 'string', nullable: true },
            icon: { type: 'string', nullable: true, example: '🌐' },
            displayOrder: { type: 'integer', default: 0 },
            isActive: { type: 'boolean', default: true },
          },
        },

        // Project Technology
        CreateTechnologyRequest: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            name: { type: 'string', example: 'React' },
            slug: { type: 'string', example: 'react' },
            icon: { type: 'string', nullable: true, example: '⚛️' },
          },
        },

        // Project
        CreateProjectRequest: {
          type: 'object',
          required: ['categoryId', 'title', 'slug'],
          properties: {
            categoryId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'E-Commerce Platform' },
            slug: { type: 'string', example: 'e-commerce-platform' },
            description: { type: 'string', nullable: true },
            overview: { type: 'string', nullable: true },
            difficulty: {
              type: 'string',
              enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'],
              default: 'BEGINNER',
            },
            estimatedDuration: { type: 'string', nullable: true, example: '4 weeks' },
            thumbnail: { type: 'string', format: 'uri', nullable: true },
            githubRepository: { type: 'string', format: 'uri', nullable: true },
            liveDemo: { type: 'string', format: 'uri', nullable: true },
            documentationUrl: { type: 'string', format: 'uri', nullable: true },
            requirements: { type: 'string', nullable: true },
            learningOutcomes: { type: 'string', nullable: true },
            isPublished: { type: 'boolean', default: false },
          },
        },

        // Team
        CreateTeamRequest: {
          type: 'object',
          required: ['projectId', 'name'],
          properties: {
            projectId: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Alpha Squad' },
            maxMembers: { type: 'integer', minimum: 2, maximum: 20, default: 5 },
          },
        },

        // Add Team Member
        AddTeamMemberRequest: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
            role: {
              type: 'string',
              enum: ['LEADER', 'DEVELOPER', 'DESIGNER', 'RESEARCHER', 'TESTER'],
              default: 'DEVELOPER',
            },
          },
        },

        // Update Member Role
        UpdateMemberRoleRequest: {
          type: 'object',
          required: ['role'],
          properties: {
            role: {
              type: 'string',
              enum: ['LEADER', 'DEVELOPER', 'DESIGNER', 'RESEARCHER', 'TESTER'],
            },
          },
        },

        // Invitation
        SendInvitationRequest: {
          type: 'object',
          required: ['teamId', 'receiverId'],
          properties: {
            teamId: { type: 'string', format: 'uuid' },
            receiverId: { type: 'string', format: 'uuid' },
            expiresInDays: { type: 'integer', minimum: 1, maximum: 30, default: 7 },
          },
        },
        UpdateInvitationRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['ACCEPTED', 'REJECTED'] },
          },
        },

        // Task
        CreateTaskRequest: {
          type: 'object',
          required: ['teamId', 'title'],
          properties: {
            teamId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Design login page' },
            description: { type: 'string', nullable: true },
            assignedTo: { type: 'string', format: 'uuid', nullable: true },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              default: 'MEDIUM',
            },
            status: {
              type: 'string',
              enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'],
              default: 'TODO',
            },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            estimatedHours: { type: 'number', nullable: true, example: 4.5 },
          },
        },

        // Milestone
        CreateMilestoneRequest: {
          type: 'object',
          required: ['projectId', 'title'],
          properties: {
            projectId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'MVP Launch' },
            description: { type: 'string', nullable: true },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
              default: 'PENDING',
            },
            completionPercentage: { type: 'number', minimum: 0, maximum: 100, default: 0 },
          },
        },

        // Comment
        CreateCommentRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: 'Looks good to me!' },
          },
        },

        // Project Dashboard
        ProjectDashboardResponse: {
          type: 'object',
          properties: {
            activeTeams: { type: 'array', items: { type: 'object' } },
            assignedTasks: { type: 'array', items: { type: 'object' } },
            completedTasksCount: { type: 'integer', example: 12 },
            upcomingDeadlines: { type: 'array', items: { type: 'object' } },
            recentActivity: { type: 'array', items: { type: 'object' } },
            teamInvitations: { type: 'array', items: { type: 'object' } },
          },
        },

        // ── PRD-05: Placement Ecosystem Schemas ─────────────────────────────

        // Job Posting
        CreateJobRequest: {
          type: 'object',
          required: ['companyId', 'title', 'type', 'description'],
          properties: {
            companyId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Software Engineer Intern' },
            type: { type: 'string', enum: ['INTERNSHIP', 'FULL_TIME', 'PART_TIME'], example: 'INTERNSHIP' },
            location: { type: 'string', example: 'Bangalore, India', nullable: true },
            workMode: { type: 'string', enum: ['REMOTE', 'HYBRID', 'ONSITE'], default: 'ONSITE' },
            description: { type: 'string', example: 'We are looking for a software engineer intern...' },
            requirements: { type: 'string', nullable: true },
            salaryRange: { type: 'string', example: '6-10 LPA', nullable: true },
            applicationUrl: { type: 'string', format: 'uri', nullable: true },
            applicationDeadline: { type: 'string', format: 'date-time', nullable: true },
            experienceRequired: { type: 'string', example: '0-1 years', nullable: true },
            isPublished: { type: 'boolean', default: false },
          },
        },

        // Job Application
        CreateJobApplicationRequest: {
          type: 'object',
          required: ['jobId'],
          properties: {
            jobId: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: ['SAVED', 'APPLIED', 'OA_SCHEDULED', 'INTERVIEW', 'HR_ROUND', 'OFFERED', 'REJECTED', 'WITHDRAWN'],
              default: 'SAVED',
            },
            notes: { type: 'string', nullable: true, example: 'Applied via LinkedIn' },
          },
        },

        // Resume
        CreateResumeRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Software Engineer Resume 2026' },
            template: { type: 'string', example: 'modern', default: 'default' },
            resumeUrl: { type: 'string', format: 'uri', nullable: true },
            atsScore: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
            isDefault: { type: 'boolean', default: false },
          },
        },

        // Resume Section
        CreateResumeSectionRequest: {
          type: 'object',
          required: ['resumeId', 'sectionType', 'content'],
          properties: {
            resumeId: { type: 'string', format: 'uuid' },
            sectionType: {
              type: 'string',
              example: 'Education',
              description: 'One of: Education, Experience, Skills, Projects, Certifications, Achievements, etc.',
            },
            content: {
              type: 'object',
              example: {
                institution: 'ABC Engineering College',
                degree: 'B.Tech CSE',
                year: '2022-2026',
                cgpa: '8.5',
              },
            },
            order: { type: 'integer', default: 0 },
          },
        },

        // Event
        CreateEventRequest: {
          type: 'object',
          required: ['title', 'type', 'startTime', 'endTime'],
          properties: {
            title: { type: 'string', example: 'National Hackathon 2026' },
            description: { type: 'string', nullable: true },
            type: {
              type: 'string',
              enum: ['HACKATHON', 'WEBINAR', 'WORKSHOP', 'CONTEST', 'BOOTCAMP', 'MEETUP'],
              example: 'HACKATHON',
            },
            organizer: { type: 'string', nullable: true, example: 'TechCorp India' },
            location: { type: 'string', nullable: true, example: 'Chennai, India' },
            startTime: { type: 'string', format: 'date-time', example: '2026-08-15T09:00:00Z' },
            endTime: { type: 'string', format: 'date-time', example: '2026-08-16T18:00:00Z' },
            registrationUrl: { type: 'string', format: 'uri', nullable: true },
            maxParticipants: { type: 'integer', nullable: true, example: 500 },
            isPublished: { type: 'boolean', default: false },
          },
        },

        // Notification
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Application Tracked' },
            message: { type: 'string', example: 'Your application for "Software Engineer" has been saved.' },
            type: {
              type: 'string',
              enum: ['PLACEMENT', 'PROJECT', 'CODING', 'LEARNING', 'EVENT', 'SYSTEM'],
            },
            isRead: { type: 'boolean', example: false },
            metadata: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Analytics Dashboard
        AnalyticsDashboardResponse: {
          type: 'object',
          properties: {
            learning: {
              type: 'object',
              properties: {
                completedLessons: { type: 'integer', example: 42 },
                currentStreak: { type: 'integer', example: 7 },
                longestStreak: { type: 'integer', example: 30 },
                totalStudyMinutes: { type: 'integer', example: 1200 },
              },
            },
            coding: {
              type: 'object',
              properties: {
                problemsSolved: { type: 'integer', example: 85 },
                totalSubmissions: { type: 'integer', example: 200 },
                acceptedSubmissions: { type: 'integer', example: 85 },
                acceptanceRate: { type: 'number', example: 42.5 },
              },
            },
            projects: {
              type: 'object',
              properties: {
                activeTeams: { type: 'integer', example: 3 },
              },
            },
            placement: {
              type: 'object',
              properties: {
                totalApplications: { type: 'integer', example: 12 },
                applicationsByStatus: { type: 'object' },
              },
            },
            resume: {
              type: 'object',
              properties: {
                totalResumes: { type: 'integer', example: 2 },
                completionScore: { type: 'integer', example: 75 },
              },
            },
            events: {
              type: 'object',
              properties: {
                registeredEvents: { type: 'integer', example: 5 },
              },
            },
          },
        },

        // Admin Dashboard
        AdminDashboardResponse: {
          type: 'object',
          properties: {
            stats: {
              type: 'object',
              properties: {
                totalUsers: { type: 'integer', example: 1500 },
                activeUsers: { type: 'integer', example: 800 },
                publishedRoadmaps: { type: 'integer', example: 25 },
                codingProblems: { type: 'integer', example: 200 },
                projects: { type: 'integer', example: 50 },
                teams: { type: 'integer', example: 120 },
                jobs: { type: 'integer', example: 30 },
                events: { type: 'integer', example: 15 },
              },
            },
            platformGrowth: { type: 'array', items: { type: 'object' } },
            dailyRegistrations: { type: 'array', items: { type: 'object' } },
          },
        },

        // Platform Settings
        UpdateSettingsRequest: {
          type: 'object',
          required: ['settings'],
          properties: {
            settings: {
              type: 'array',
              items: {
                type: 'object',
                required: ['key', 'value'],
                properties: {
                  key: { type: 'string', example: 'maintenanceMode' },
                  value: { type: 'string', example: 'false' },
                  description: { type: 'string', nullable: true, example: 'Toggle maintenance mode' },
                },
              },
            },
          },
        },
        // ── PRD-07: Role Management Schemas ─────────────────────────────

        // Manager Permission
        ManagerPermission: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            managerId: { type: 'string', format: 'uuid' },
            module: {
              type: 'string',
              enum: ['LEARNING', 'CODING', 'PROJECTS', 'PLACEMENTS', 'EVENTS', 'NOTIFICATIONS', 'REPORTS'],
            },
            canCreate: { type: 'boolean', example: true },
            canRead: { type: 'boolean', example: true },
            canUpdate: { type: 'boolean', example: true },
            canDelete: { type: 'boolean', example: false },
            canPublish: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        // Update Manager Permissions Request
        UpdateManagerPermissionsRequest: {
          type: 'object',
          properties: {
            learning: { type: 'boolean', example: true },
            coding: { type: 'boolean', example: true },
            projects: { type: 'boolean', example: false },
            placements: { type: 'boolean', example: true },
            events: { type: 'boolean', example: false },
            notifications: { type: 'boolean', example: true },
            reports: { type: 'boolean', example: true },
          },
          example: {
            learning: true,
            coding: true,
            projects: false,
            placements: true,
            events: false,
            notifications: true,
          },
        },

        // Promote User Request
        PromoteUserRequest: {
          type: 'object',
          properties: {
            reason: { type: 'string', example: 'Promoted for outstanding content contributions' },
            modules: {
              type: 'object',
              properties: {
                learning: { type: 'boolean' },
                coding: { type: 'boolean' },
                projects: { type: 'boolean' },
                placements: { type: 'boolean' },
                events: { type: 'boolean' },
                notifications: { type: 'boolean' },
                reports: { type: 'boolean' },
              },
            },
          },
        },

        // Demote User Request
        DemoteUserRequest: {
          type: 'object',
          properties: {
            reason: { type: 'string', example: 'Role no longer required' },
          },
        },

        // Audit Log
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            performedBy: { type: 'string', format: 'uuid' },
            targetUser: { type: 'string', format: 'uuid', nullable: true },
            role: { type: 'string', example: 'SUPER_ADMIN' },
            action: { type: 'string', example: 'USER_PROMOTED' },
            module: { type: 'string', nullable: true, example: 'LEARNING' },
            entity: { type: 'string', nullable: true, example: 'User' },
            entityId: { type: 'string', nullable: true },
            oldValue: { type: 'object', nullable: true },
            newValue: { type: 'object', nullable: true },
            ipAddress: { type: 'string', nullable: true },
            userAgent: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Role History
        RoleHistory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            oldRole: { type: 'string', example: 'STUDENT' },
            newRole: { type: 'string', example: 'MANAGER' },
            reason: { type: 'string', nullable: true },
            changedBy: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Super Admin Dashboard
        SuperAdminDashboardResponse: {
          type: 'object',
          properties: {
            users: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 2500 },
                managers: { type: 'integer', example: 5 },
                students: { type: 'integer', example: 2494 },
                activeSessions: { type: 'integer', example: 120 },
                newToday: { type: 'integer', example: 18 },
                newThisMonth: { type: 'integer', example: 350 },
              },
            },
            content: {
              type: 'object',
              properties: {
                roadmaps: { type: 'integer', example: 25 },
                problems: { type: 'integer', example: 200 },
                projects: { type: 'integer', example: 50 },
                jobs: { type: 'integer', example: 30 },
                events: { type: 'integer', example: 10 },
              },
            },
            recentActivity: { type: 'array', items: { type: 'object' } },
          },
        },

        // Platform Analytics
        PlatformAnalyticsResponse: {
          type: 'object',
          properties: {
            learning: { type: 'object' },
            coding: { type: 'object' },
            projects: { type: 'object' },
            users: { type: 'object' },
            placements: { type: 'object' },
            metrics: { type: 'array', items: { type: 'object' } },
          },
        },

        // Manager Dashboard
        ManagerDashboardResponse: {
          type: 'object',
          properties: {
            publishedRoadmaps: { type: 'integer', example: 12 },
            drafts: { type: 'integer', example: 3 },
            problems: {
              type: 'object',
              properties: {
                published: { type: 'integer', example: 85 },
                draft: { type: 'integer', example: 10 },
              },
            },
            projects: { type: 'integer', example: 25 },
            events: { type: 'integer', example: 8 },
            jobs: { type: 'integer', example: 15 },
          },
        },

        // Broadcast Notification Request
        BroadcastNotificationRequest: {
          type: 'object',
          required: ['title', 'message'],
          properties: {
            title: { type: 'string', example: 'System Update' },
            message: { type: 'string', example: 'The platform will undergo maintenance tonight.' },
            type: {
              type: 'string',
              enum: ['PLACEMENT', 'PROJECT', 'CODING', 'LEARNING', 'EVENT', 'SYSTEM'],
              default: 'SYSTEM',
            },
            targetRole: {
              type: 'string',
              enum: ['STUDENT', 'MANAGER'],
              description: 'If omitted, sends to all users',
              nullable: true,
            },
          },
        },

        // Bulk Action Request
        BulkActionRequest: {
          type: 'object',
          required: ['entity', 'ids'],
          properties: {
            entity: {
              type: 'string',
              enum: ['roadmaps', 'problems', 'projects', 'jobs', 'events'],
            },
            ids: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              minItems: 1,
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/controllers/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
