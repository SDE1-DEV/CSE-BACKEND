"use strict";
/**
 * Prisma Seed Script
 *
 * Seeds accounts (Admin, Manager, Student) and baseline CMS content so that the
 * Manager Console is fully testable end-to-end with real PostgreSQL data:
 *   - Learning:   Categories ΓåÆ Roadmaps ΓåÆ Sections ΓåÆ Lessons ΓåÆ Resources
 *   - Coding:     Problem Categories, Tags, Companies, Problems (+ test cases, templates)
 *   - Projects:   Categories, Technologies, Projects
 *   - Placements: Companies, Job Postings
 *   - Events:     Sample events
 *   - CMS Extras: FAQ Categories/FAQs, Testimonials, Banners
 *
 * Idempotent: safe to run repeatedly (upsert on unique slugs + existence guards).
 *
 * Usage:
 *   npx prisma db seed
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const python_seed_data_1 = require("./python-seed-data");
// Seeding is a one-off script: connect via the DIRECT (non-pooled) connection.
// The runtime DATABASE_URL points at the Supabase transaction pooler (PgBouncer,
// port 6543) which does not support Prisma's prepared statements across repeated
// runs ΓÇö re-running the seed there fails with `prepared statement "s0" already
// exists` (Postgres 42P05). DIRECT_URL (port 5432) avoids that entirely.
const seedDbUrl = process.env['DIRECT_URL'] || process.env['DATABASE_URL'];
const prisma = new client_1.PrismaClient({
    datasources: { db: { url: seedDbUrl } },
});
// ΓöÇΓöÇ Helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
async function upsertUser(opts) {
    const passwordHash = await bcrypt.hash(opts.password, 12);
    return prisma.user.upsert({
        where: { email: opts.email },
        update: { role: opts.role, isVerified: true },
        create: {
            fullName: opts.fullName,
            email: opts.email,
            passwordHash,
            role: opts.role,
            isVerified: true,
            collegeName: 'CSE Platform',
            ...(opts.extra ?? {}),
        },
    });
}
const PERMISSION_MODULES = [
    'LEARNING', 'CODING', 'PROJECTS', 'PLACEMENTS', 'EVENTS', 'NOTIFICATIONS', 'REPORTS',
];
async function grantAllPermissions(managerId) {
    for (const module of PERMISSION_MODULES) {
        await prisma.managerPermission.upsert({
            where: { managerId_module: { managerId, module } },
            update: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, canPublish: true },
            create: {
                managerId,
                module,
                canCreate: true,
                canRead: true,
                canUpdate: true,
                canDelete: true,
                canPublish: true,
            },
        });
    }
}
async function main() {
    console.log('≡ƒî▒ Seeding database...');
    // ΓöÇΓöÇ Accounts ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const admin = await upsertUser({
        email: 'admin@cse.dev',
        password: 'Admin@123',
        fullName: 'Platform Admin',
        role: client_1.Role.SUPER_ADMIN,
    });
    console.log(`Γ£à Admin:   admin@cse.dev / Admin@123`);
    const manager = await upsertUser({
        email: 'manager@cse.dev',
        password: 'Manager@123',
        fullName: 'Content Manager',
        role: client_1.Role.MANAGER,
    });
    await grantAllPermissions(manager.id);
    console.log(`Γ£à Manager: manager@cse.dev / Manager@123 (all module permissions)`);
    await upsertUser({
        email: 'student@cse.dev',
        password: 'Student@123',
        fullName: 'Test Student',
        role: client_1.Role.STUDENT,
        extra: { branch: 'Computer Science', currentYear: 3, collegeName: 'CSE College' },
    });
    console.log(`Γ£à Student: student@cse.dev / Student@123`);
    const createdBy = manager.id;
    // ΓöÇΓöÇ Learning: Categories ΓåÆ Roadmaps ΓåÆ Sections ΓåÆ Lessons ΓåÆ Resources ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    // NOTE: We explicitly UNPUBLISH all legacy sample roadmaps. Only the Python
    // roadmap (seeded below) is isPublished=true ΓÇö per the PRD requirement that
    // GET /roadmaps with no filters returns ONLY Python.
    const learningData = [
        {
            category: { title: 'Web Development', slug: 'web-development', icon: '≡ƒîÉ', description: 'Frontend and backend web technologies', displayOrder: 2 },
            roadmap: {
                title: 'Full-Stack Web Developer', slug: 'full-stack-web-developer',
                description: 'Become a full-stack developer from scratch', difficulty: 'BEGINNER',
                estimatedHours: 120, isPublished: false,
            },
        },
        {
            category: { title: 'Data Structures & Algorithms', slug: 'dsa', icon: '≡ƒº«', description: 'Core CS problem solving', displayOrder: 3 },
            roadmap: {
                title: 'DSA Mastery', slug: 'dsa-mastery',
                description: 'Master data structures and algorithms', difficulty: 'INTERMEDIATE',
                estimatedHours: 200, isPublished: false,
            },
        },
        {
            category: { title: 'System Design', slug: 'system-design', icon: '≡ƒÅù∩╕Å', description: 'Design scalable systems', displayOrder: 4 },
            roadmap: {
                title: 'System Design Interview Prep', slug: 'system-design-prep',
                description: 'Prepare for system design interviews', difficulty: 'ADVANCED',
                estimatedHours: 80, isPublished: false,
            },
        },
    ];
    for (const { category, roadmap } of learningData) {
        const cat = await prisma.category.upsert({
            where: { slug: category.slug },
            update: category,
            create: category,
        });
        await prisma.roadmap.upsert({
            where: { slug: roadmap.slug },
            update: { ...roadmap, isPublished: false, categoryId: cat.id },
            create: { ...roadmap, categoryId: cat.id },
        });
    }
    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    // Programming Category + Python Programming Roadmap (PUBLISHED, idempotent)
    // ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const programmingCat = await prisma.category.upsert({
        where: { slug: 'programming' },
        update: {
            title: 'Programming',
            slug: 'programming',
            description: 'Core programming languages and fundamentals',
            icon: '≡ƒÆ╗',
            displayOrder: 1,
            isActive: true,
        },
        create: {
            title: 'Programming',
            slug: 'programming',
            description: 'Core programming languages and fundamentals',
            icon: '≡ƒÆ╗',
            displayOrder: 1,
            isActive: true,
        },
    });
    const pythonRoadmap = await prisma.roadmap.upsert({
        where: { slug: 'python' },
        update: {
            title: 'Python Programming',
            slug: 'python',
            categoryId: programmingCat.id,
            difficulty: 'BEGINNER',
            description: 'Learn Python from scratch - the complete beginner\'s roadmap covering fundamentals to advanced concepts.',
            prerequisites: 'No prior programming experience required. A computer with internet access.',
            learningOutcomes: 'Master Python syntax, write real programs, build projects, prepare for jobs',
            estimatedHours: 120,
            tags: 'Python,Programming,Beginner,Backend',
            banner: null,
            thumbnail: null,
            visibility: 'PUBLIC',
            isPublished: true,
        },
        create: {
            title: 'Python Programming',
            slug: 'python',
            categoryId: programmingCat.id,
            difficulty: 'BEGINNER',
            description: 'Learn Python from scratch - the complete beginner\'s roadmap covering fundamentals to advanced concepts.',
            prerequisites: 'No prior programming experience required. A computer with internet access.',
            learningOutcomes: 'Master Python syntax, write real programs, build projects, prepare for jobs',
            estimatedHours: 120,
            tags: 'Python,Programming,Beginner,Backend',
            banner: null,
            thumbnail: null,
            visibility: 'PUBLIC',
            isPublished: true,
        },
    });
    // ΓöÇΓöÇ All 16 Roadmap Sections (upsert by roadmapId + title combo) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const sectionDefs = [
        { title: 'Introduction', order: 0 },
        { title: 'Programming Basics', order: 1 },
        { title: 'Variables & Data Types', order: 2 },
        { title: 'Operators', order: 3 },
        { title: 'Input & Output', order: 4 },
        { title: 'Conditional Statements', order: 5 },
        { title: 'Loops', order: 6 },
        { title: 'Functions', order: 7 },
        { title: 'Collections (List, Tuple, Set, Dict)', order: 8 },
        { title: 'Strings', order: 9 },
        { title: 'File Handling', order: 10 },
        { title: 'Modules & Packages', order: 11 },
        { title: 'Object Oriented Programming', order: 12 },
        { title: 'Exception Handling', order: 13 },
        { title: 'Advanced Python Concepts', order: 14 },
        { title: 'Python Projects', order: 15 },
    ];
    const sectionMap = {};
    for (const s of sectionDefs) {
        const existing = await prisma.roadmapSection.findFirst({
            where: { roadmapId: pythonRoadmap.id, title: s.title, deletedAt: null },
        });
        if (existing) {
            const updated = await prisma.roadmapSection.update({
                where: { id: existing.id },
                data: { order: s.order, description: null },
            });
            sectionMap[s.title] = updated.id;
        }
        else {
            const created = await prisma.roadmapSection.create({
                data: { roadmapId: pythonRoadmap.id, title: s.title, order: s.order, description: null },
            });
            sectionMap[s.title] = created.id;
        }
    }
    // ΓöÇΓöÇ Lessons (upsert by slug; all are NOTE + published) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const pythonLessons = (0, python_seed_data_1.getLessons)();
    for (const l of pythonLessons) {
        const sectionId = sectionMap[l.sectionTitle];
        if (!sectionId)
            continue;
        await prisma.lesson.upsert({
            where: { slug: l.lessonSlug },
            update: {
                sectionId,
                title: l.lessonTitle,
                contentType: 'NOTE',
                estimatedMinutes: l.estimatedMinutes,
                order: l.lessonOrder,
                isPublished: true,
                content: l.content,
            },
            create: {
                sectionId,
                title: l.lessonTitle,
                slug: l.lessonSlug,
                contentType: 'NOTE',
                estimatedMinutes: l.estimatedMinutes,
                order: l.lessonOrder,
                isPublished: true,
                content: l.content,
                description: null,
            },
        });
    }
    // ── Seed Quiz & Practice Questions for each lesson ──────────────────────────
    // Each lesson gets 5 quiz MCQs and 5 practice questions so the frontend
    // never falls back to static fallback data.  Managers can replace these
    // via the CMS at any time.
    const allSeededLessons = await prisma.lesson.findMany({
        where: {
            section: { roadmapId: pythonRoadmap.id, deletedAt: null },
            deletedAt: null,
            isPublished: true,
        },
        select: { id: true, title: true, slug: true },
    });
    let totalQz = 0;
    let totalPq = 0;
    for (const lesson of allSeededLessons) {
        const existingQuiz = await prisma.quizQuestion.count({ where: { lessonId: lesson.id } });
        if (existingQuiz === 0) {
            // 5 placeholder MCQs
            const quizQuestionsData = [
                { q: `What is the primary purpose of ${lesson.title}?`, opts: ['To read data', 'To process logic correctly', 'To output results', 'To store values'], correct: 1 },
                { q: `Which keyword is most associated with ${lesson.title} in Python?`, opts: ['import', 'def', 'class', 'return'], correct: 1 },
                { q: `In Python, which of the following best describes ${lesson.title}?`, opts: ['A built-in function', 'A core language concept', 'An external library', 'A syntax error'], correct: 1 },
                { q: `When learning ${lesson.title}, which step comes first?`, opts: ['Testing edge cases', 'Understanding the definition', 'Writing complex programs', 'Optimizing performance'], correct: 1 },
                { q: `Which of the following is a best practice for ${lesson.title}?`, opts: ['Avoid comments', 'Write readable code', 'Skip error handling', 'Use global variables'], correct: 1 },
            ];
            for (let i = 0; i < quizQuestionsData.length; i++) {
                const qd = quizQuestionsData[i];
                const qq = await prisma.quizQuestion.create({
                    data: {
                        id: `${lesson.id}-qq-${i}`,
                        lessonId: lesson.id,
                        question: qd.q,
                        explanation: `This question tests understanding of ${lesson.title}. Review the lesson content for details.`,
                        difficulty: 'BEGINNER',
                        displayOrder: i,
                    },
                });
                for (let j = 0; j < qd.opts.length; j++) {
                    await prisma.quizOption.create({
                        data: {
                            id: `${qq.id}-opt-${j}`,
                            quizQuestionId: qq.id,
                            text: qd.opts[j],
                            isCorrect: j === qd.correct,
                            displayOrder: j,
                        },
                    });
                }
                totalQz++;
            }
        }
        const existingPractice = await prisma.lessonPracticeQuestion.count({ where: { lessonId: lesson.id } });
        if (existingPractice === 0) {
            const practiceData = [
                { q: `In your own words, explain the main concept of ${lesson.title}.`, a: `${lesson.title} is a fundamental Python concept. Refer to the lesson content for a detailed explanation.`, diff: 'BEGINNER' },
                { q: `Give a real-world example where you would use ${lesson.title}.`, a: `A practical scenario for ${lesson.title} includes data processing, web development, and automation tasks.`, diff: 'BEGINNER' },
                { q: `Write a simple Python code snippet demonstrating ${lesson.title}.`, a: `# Example demonstrating ${lesson.title}\n# See the lesson code examples for reference`, diff: 'BEGINNER' },
                { q: `What are two common mistakes when working with ${lesson.title}? How do you avoid them?`, a: `Common mistakes include incorrect syntax and not handling edge cases. Always test with multiple inputs.`, diff: 'INTERMEDIATE' },
                { q: `How does ${lesson.title} connect to the other Python concepts you have learned so far?`, a: `${lesson.title} builds on previous concepts and is used in more advanced topics like OOP and file handling.`, diff: 'INTERMEDIATE' },
            ];
            for (let i = 0; i < practiceData.length; i++) {
                const pd = practiceData[i];
                await prisma.lessonPracticeQuestion.create({
                    data: {
                        id: `${lesson.id}-pq-${i}`,
                        lessonId: lesson.id,
                        question: pd.q,
                        answer: pd.a,
                        hint: `Think about how you use ${lesson.title} in everyday Python programming.`,
                        difficulty: pd.diff,
                        displayOrder: i,
                    },
                });
                totalPq++;
            }
        }
    }
    console.log(`✅ Learning: Programming category + Python roadmap (${sectionDefs.length} sections, ${pythonLessons.length} lessons, ${totalQz} quiz Qs, ${totalPq} practice Qs)`);
    // ΓöÇΓöÇ Coding: Categories, Tags, Companies, Problems ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const problemCategories = [
        { name: 'Arrays & Strings', slug: 'arrays-strings', description: 'Array and string manipulation', displayOrder: 1 },
        { name: 'Linked Lists', slug: 'linked-lists', description: 'Singly and doubly linked lists', displayOrder: 2 },
        { name: 'Dynamic Programming', slug: 'dynamic-programming', description: 'DP problems and patterns', displayOrder: 3 },
        { name: 'Trees & Graphs', slug: 'trees-graphs', description: 'Tree and graph traversal', displayOrder: 4 },
    ];
    const pcMap = {};
    for (const pc of problemCategories) {
        const rec = await prisma.problemCategory.upsert({ where: { slug: pc.slug }, update: {}, create: pc });
        pcMap[pc.slug] = rec.id;
    }
    const problemTags = [
        { name: 'Array', slug: 'array' }, { name: 'String', slug: 'string' },
        { name: 'Hash Table', slug: 'hash-table' }, { name: 'Two Pointers', slug: 'two-pointers' },
        { name: 'Dynamic Programming', slug: 'dp' }, { name: 'Recursion', slug: 'recursion' },
    ];
    const tagMap = {};
    for (const tag of problemTags) {
        const rec = await prisma.problemTag.upsert({ where: { slug: tag.slug }, update: {}, create: tag });
        tagMap[tag.slug] = rec.id;
    }
    const companies = [
        { name: 'Google', slug: 'google', industry: 'Technology', headquarters: 'Mountain View, CA', website: 'https://google.com', verified: true },
        { name: 'Amazon', slug: 'amazon', industry: 'E-commerce / Cloud', headquarters: 'Seattle, WA', website: 'https://amazon.com', verified: true },
        { name: 'Microsoft', slug: 'microsoft', industry: 'Technology', headquarters: 'Redmond, WA', website: 'https://microsoft.com', verified: true },
        { name: 'Flipkart', slug: 'flipkart', industry: 'E-commerce', headquarters: 'Bangalore, India', website: 'https://flipkart.com', verified: true },
    ];
    const companyMap = {};
    for (const co of companies) {
        const rec = await prisma.company.upsert({ where: { slug: co.slug }, update: {}, create: co });
        companyMap[co.slug] = rec.id;
    }
    const problems = [
        {
            categorySlug: 'arrays-strings', title: 'Two Sum', slug: 'two-sum',
            description: 'Find two numbers that add up to a target.',
            problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            inputFormat: 'First line: array. Second line: target.', outputFormat: 'Two indices.',
            constraints: '2 <= nums.length <= 10^4', sampleInput: '[2,7,11,15]\n9', sampleOutput: '[0,1]',
            difficulty: 'EASY', points: 10, isPublished: true,
            tags: ['array', 'hash-table'], companies: ['google', 'amazon'],
            testCases: [
                { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isSample: true },
                { input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: true },
            ],
            templates: [
                { language: 'PYTHON', template: 'def two_sum(nums, target):\n    pass' },
                { language: 'JAVASCRIPT', template: 'function twoSum(nums, target) {}' },
            ],
        },
        {
            categorySlug: 'linked-lists', title: 'Reverse Linked List', slug: 'reverse-linked-list',
            description: 'Reverse a singly linked list.',
            problemStatement: 'Given the head of a singly linked list, reverse the list and return the reversed list.',
            constraints: '0 <= n <= 5000', sampleInput: '[1,2,3,4,5]', sampleOutput: '[5,4,3,2,1]',
            difficulty: 'EASY', points: 10, isPublished: true,
            tags: ['recursion'], companies: ['microsoft'],
            testCases: [{ input: '[1,2,3]', expectedOutput: '[3,2,1]', isSample: true }],
            templates: [{ language: 'PYTHON', template: 'def reverse_list(head):\n    pass' }],
        },
        {
            categorySlug: 'dynamic-programming', title: 'Climbing Stairs', slug: 'climbing-stairs',
            description: 'Count distinct ways to climb to the top.',
            problemStatement: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
            constraints: '1 <= n <= 45', sampleInput: '3', sampleOutput: '3',
            difficulty: 'MEDIUM', points: 20, isPublished: false,
            tags: ['dp'], companies: ['amazon', 'flipkart'],
            testCases: [{ input: '2', expectedOutput: '2', isSample: true }],
            templates: [{ language: 'JAVA', template: 'class Solution { int climbStairs(int n) { return 0; } }' }],
        },
    ];
    for (const p of problems) {
        const { categorySlug, tags, companies: cos, testCases, templates, ...fields } = p;
        const problem = await prisma.codingProblem.upsert({
            where: { slug: fields.slug },
            update: {},
            create: { ...fields, categoryId: pcMap[categorySlug] },
        });
        if ((await prisma.testCase.count({ where: { problemId: problem.id } })) === 0) {
            await prisma.testCase.createMany({ data: testCases.map((tc) => ({ ...tc, problemId: problem.id })) });
        }
        if ((await prisma.codeTemplate.count({ where: { problemId: problem.id } })) === 0) {
            await prisma.codeTemplate.createMany({ data: templates.map((t) => ({ ...t, problemId: problem.id })) });
        }
        await prisma.problemTagRelation.createMany({
            data: tags.map((t) => ({ problemId: problem.id, tagId: tagMap[t] })),
            skipDuplicates: true,
        });
        await prisma.problemCompany.createMany({
            data: cos.map((c) => ({ problemId: problem.id, companyId: companyMap[c] })),
            skipDuplicates: true,
        });
    }
    console.log(`Γ£à Coding: ${problemCategories.length} categories, ${problemTags.length} tags, ${companies.length} companies, ${problems.length} problems`);
    // ΓöÇΓöÇ Projects: Categories, Technologies, Projects ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const projectCategories = [
        { name: 'Full Stack', slug: 'full-stack', description: 'End-to-end web applications', displayOrder: 1 },
        { name: 'Machine Learning', slug: 'machine-learning', description: 'ML and data science projects', displayOrder: 2 },
        { name: 'Mobile', slug: 'mobile', description: 'Android and iOS apps', displayOrder: 3 },
    ];
    const projCatMap = {};
    for (const pc of projectCategories) {
        const rec = await prisma.projectCategory.upsert({ where: { slug: pc.slug }, update: {}, create: pc });
        projCatMap[pc.slug] = rec.id;
    }
    const technologies = [
        { name: 'React', slug: 'react' }, { name: 'Node.js', slug: 'nodejs' },
        { name: 'TypeScript', slug: 'typescript' }, { name: 'Python', slug: 'python' },
        { name: 'MongoDB', slug: 'mongodb' },
    ];
    const techMap = {};
    for (const t of technologies) {
        const rec = await prisma.projectTechnology.upsert({ where: { slug: t.slug }, update: {}, create: t });
        techMap[t.slug] = rec.id;
    }
    const projects = [
        {
            categorySlug: 'full-stack', title: 'E-Commerce Platform', slug: 'ecommerce-platform',
            description: 'A full-stack e-commerce app with cart and payments.',
            difficulty: 'INTERMEDIATE', estimatedDuration: '4 weeks', isPublished: true,
            technologies: ['react', 'nodejs', 'mongodb'],
        },
        {
            categorySlug: 'machine-learning', title: 'Movie Recommendation Engine', slug: 'movie-recommender',
            description: 'Build a collaborative-filtering recommender.',
            difficulty: 'ADVANCED', estimatedDuration: '3 weeks', isPublished: false,
            technologies: ['python'],
        },
    ];
    for (const p of projects) {
        const { categorySlug, technologies: techs, ...fields } = p;
        const project = await prisma.project.upsert({
            where: { slug: fields.slug },
            update: {},
            create: { ...fields, categoryId: projCatMap[categorySlug] },
        });
        await prisma.projectTechnologyRelation.createMany({
            data: techs.map((t) => ({ projectId: project.id, technologyId: techMap[t] })),
            skipDuplicates: true,
        });
    }
    console.log(`Γ£à Projects: ${projectCategories.length} categories, ${technologies.length} technologies, ${projects.length} projects`);
    // ΓöÇΓöÇ Placements: Job Postings ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const jobs = [
        { companySlug: 'google', title: 'Software Engineer Intern', type: 'INTERNSHIP', workMode: 'ONSITE', location: 'Bangalore', description: 'Summer 2026 SWE internship.', salaryRange: 'Γé╣1,00,000/month', isPublished: true },
        { companySlug: 'amazon', title: 'SDE-1', type: 'FULL_TIME', workMode: 'HYBRID', location: 'Hyderabad', description: 'Entry-level backend engineer.', salaryRange: 'Γé╣28 LPA', isPublished: true },
        { companySlug: 'flipkart', title: 'Frontend Engineer', type: 'FULL_TIME', workMode: 'REMOTE', location: 'Remote', description: 'React/TypeScript frontend role.', salaryRange: 'Γé╣22 LPA', isPublished: false },
    ];
    for (const j of jobs) {
        const { companySlug, ...fields } = j;
        const companyId = companyMap[companySlug];
        const exists = await prisma.jobPosting.findFirst({ where: { title: fields.title, companyId } });
        if (!exists)
            await prisma.jobPosting.create({ data: { ...fields, companyId } });
    }
    console.log(`Γ£à Placements: ${jobs.length} job postings`);
    // ΓöÇΓöÇ Events ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const now = Date.now();
    const events = [
        { title: 'Intro to System Design Webinar', description: 'Live webinar covering system design basics.', type: 'WEBINAR', organizer: 'CSE Platform', location: 'Online', startTime: new Date(now + 7 * 864e5), endTime: new Date(now + 7 * 864e5 + 2 * 36e5), maxParticipants: 500, isPublished: true },
        { title: 'CSE Annual Hackathon 2026', description: '24-hour hackathon with prizes.', type: 'HACKATHON', organizer: 'CSE Platform', location: 'Campus Auditorium', startTime: new Date(now + 30 * 864e5), endTime: new Date(now + 31 * 864e5), maxParticipants: 200, isPublished: true },
    ];
    for (const e of events) {
        const exists = await prisma.event.findFirst({ where: { title: e.title } });
        if (!exists)
            await prisma.event.create({ data: e });
    }
    console.log(`Γ£à Events: ${events.length} events`);
    // ΓöÇΓöÇ FAQ ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const faqCategories = [
        { name: 'General', slug: 'general', displayOrder: 1 },
        { name: 'Placements', slug: 'placements', displayOrder: 2 },
    ];
    const faqCatMap = {};
    for (const fc of faqCategories) {
        const rec = await prisma.faqCategory.upsert({ where: { slug: fc.slug }, update: {}, create: fc });
        faqCatMap[fc.slug] = rec.id;
    }
    const faqs = [
        { categorySlug: 'general', question: 'What is the CSE Platform?', answer: 'An all-in-one learning, coding, projects and placement platform.', isPublished: true, displayOrder: 1 },
        { categorySlug: 'general', question: 'Is it free to use?', answer: 'Yes, core features are free for students.', isPublished: true, displayOrder: 2 },
        { categorySlug: 'placements', question: 'How do I apply to jobs?', answer: 'Browse the Placements module and use the apply link.', isPublished: true, displayOrder: 1 },
    ];
    for (const f of faqs) {
        const { categorySlug, ...fields } = f;
        const exists = await prisma.faq.findFirst({ where: { question: fields.question } });
        if (!exists)
            await prisma.faq.create({ data: { ...fields, categoryId: faqCatMap[categorySlug], createdBy } });
    }
    console.log(`Γ£à FAQ: ${faqCategories.length} categories, ${faqs.length} FAQs`);
    // ΓöÇΓöÇ Testimonials ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const testimonials = [
        { studentName: 'Priya Sharma', role: 'SDE @ Amazon', company: 'Amazon', content: 'The DSA roadmap and mock problems got me placed!', rating: 5, isFeatured: true, isPublished: true },
        { studentName: 'Rahul Verma', role: 'Frontend Dev @ Flipkart', company: 'Flipkart', content: 'Loved the project hub ΓÇö real teamwork experience.', rating: 5, isFeatured: false, isPublished: true },
    ];
    for (const t of testimonials) {
        const exists = await prisma.testimonial.findFirst({ where: { studentName: t.studentName } });
        if (!exists)
            await prisma.testimonial.create({ data: { ...t, createdBy } });
    }
    console.log(`Γ£à Testimonials: ${testimonials.length}`);
    // ΓöÇΓöÇ Banners ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    const banners = [
        { title: 'Welcome to CSE Platform', placement: 'HOMEPAGE', type: 'IMAGE', mediaUrl: 'https://placehold.co/1200x300?text=Welcome', ctaText: 'Get Started', ctaLink: '/learning', priority: 10, isActive: true },
    ];
    for (const b of banners) {
        const exists = await prisma.banner.findFirst({ where: { title: b.title } });
        if (!exists)
            await prisma.banner.create({ data: { ...b, createdBy } });
    }
    console.log(`Γ£à Banners: ${banners.length}`);
    console.log('\n≡ƒÄë Seed complete!');
    console.log('ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ');
    console.log('Admin   ΓåÆ admin@cse.dev   / Admin@123');
    console.log('Manager ΓåÆ manager@cse.dev / Manager@123');
    console.log('Student ΓåÆ student@cse.dev / Student@123');
    console.log('ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ');
}
main()
    .catch((e) => {
    console.error('Γ¥î Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
