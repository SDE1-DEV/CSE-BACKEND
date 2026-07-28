/**
 * Prisma Seed Script
 *
 * Seeds accounts (Admin, Manager, Student) and baseline CMS content so that the
 * Manager Console is fully testable end-to-end with real PostgreSQL data:
 *   - Learning:   Categories → Roadmaps → Sections → Lessons → Resources
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

import { PrismaClient, Role, ContentType } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { getLessons } from './python-seed-data'

// Seeding is a one-off script: connect via the DIRECT (non-pooled) connection.
// The runtime DATABASE_URL points at the Supabase transaction pooler (PgBouncer,
// port 6543) which does not support Prisma's prepared statements across repeated
// runs — re-running the seed there fails with `prepared statement "s0" already
// exists` (Postgres 42P05). DIRECT_URL (port 5432) avoids that entirely.
const seedDbUrl = process.env['DIRECT_URL'] || process.env['DATABASE_URL']

const prisma = new PrismaClient({
  datasources: { db: { url: seedDbUrl } },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

async function upsertUser(opts: {
  email: string
  password: string
  fullName: string
  role: Role
  extra?: Record<string, unknown>
}) {
  const passwordHash = await bcrypt.hash(opts.password, 12)
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
  })
}

const PERMISSION_MODULES = [
  'LEARNING', 'CODING', 'PROJECTS', 'PLACEMENTS', 'EVENTS', 'NOTIFICATIONS', 'REPORTS',
] as const

async function grantAllPermissions(managerId: string) {
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
    })
  }
}

async function main() {
  console.log('🌱 Seeding database...')

  // ── Accounts ────────────────────────────────────────────────────────────────
  const admin = await upsertUser({
    email: 'admin@cse.dev',
    password: 'Admin@123',
    fullName: 'Platform Admin',
    role: Role.SUPER_ADMIN,
  })
  console.log(`✅ Admin:   admin@cse.dev / Admin@123`)

  const manager = await upsertUser({
    email: 'manager@cse.dev',
    password: 'Manager@123',
    fullName: 'Content Manager',
    role: Role.MANAGER,
  })
  await grantAllPermissions(manager.id)
  console.log(`✅ Manager: manager@cse.dev / Manager@123 (all module permissions)`)

  await upsertUser({
    email: 'student@cse.dev',
    password: 'Student@123',
    fullName: 'Test Student',
    role: Role.STUDENT,
    extra: { branch: 'Computer Science', currentYear: 3, collegeName: 'CSE College' },
  })
  console.log(`✅ Student: student@cse.dev / Student@123`)

  const createdBy = manager.id

  // ── Learning: Categories → Roadmaps → Sections → Lessons → Resources ─────────
  // NOTE: We explicitly UNPUBLISH all legacy sample roadmaps. Only the Python
  // roadmap (seeded below) is isPublished=true — per the PRD requirement that
  // GET /roadmaps with no filters returns ONLY Python.

  const learningData = [
    {
      category: { title: 'Web Development', slug: 'web-development', icon: '🌐', description: 'Frontend and backend web technologies', displayOrder: 2 },
      roadmap: {
        title: 'Full-Stack Web Developer', slug: 'full-stack-web-developer',
        description: 'Become a full-stack developer from scratch', difficulty: 'BEGINNER' as const,
        estimatedHours: 120, isPublished: false,
      },
    },
    {
      category: { title: 'Data Structures & Algorithms', slug: 'dsa', icon: '🧮', description: 'Core CS problem solving', displayOrder: 3 },
      roadmap: {
        title: 'DSA Mastery', slug: 'dsa-mastery',
        description: 'Master data structures and algorithms', difficulty: 'INTERMEDIATE' as const,
        estimatedHours: 200, isPublished: false,
      },
    },
    {
      category: { title: 'System Design', slug: 'system-design', icon: '🏗️', description: 'Design scalable systems', displayOrder: 4 },
      roadmap: {
        title: 'System Design Interview Prep', slug: 'system-design-prep',
        description: 'Prepare for system design interviews', difficulty: 'ADVANCED' as const,
        estimatedHours: 80, isPublished: false,
      },
    },
  ]

  for (const { category, roadmap } of learningData) {
    const cat = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
    await prisma.roadmap.upsert({
      where: { slug: roadmap.slug },
      update: { ...roadmap, isPublished: false, categoryId: cat.id },
      create: { ...roadmap, categoryId: cat.id },
    })
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Programming Category + Python Programming Roadmap (PUBLISHED, idempotent)
  // ──────────────────────────────────────────────────────────────────────────
  const programmingCat = await prisma.category.upsert({
    where: { slug: 'programming' },
    update: {
      title: 'Programming',
      slug: 'programming',
      description: 'Core programming languages and fundamentals',
      icon: '💻',
      displayOrder: 1,
      isActive: true,
    },
    create: {
      title: 'Programming',
      slug: 'programming',
      description: 'Core programming languages and fundamentals',
      icon: '💻',
      displayOrder: 1,
      isActive: true,
    },
  })

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
  })

  // ── All 16 Roadmap Sections (upsert by roadmapId + title combo) ──────────
  const sectionDefs: { title: string; order: number }[] = [
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
  ]

  const sectionMap: Record<string, string> = {}
  for (const s of sectionDefs) {
    const existing = await prisma.roadmapSection.findFirst({
      where: { roadmapId: pythonRoadmap.id, title: s.title, deletedAt: null },
    })
    if (existing) {
      const updated = await prisma.roadmapSection.update({
        where: { id: existing.id },
        data: { order: s.order, description: null },
      })
      sectionMap[s.title] = updated.id
    } else {
      const created = await prisma.roadmapSection.create({
        data: { roadmapId: pythonRoadmap.id, title: s.title, order: s.order, description: null },
      })
      sectionMap[s.title] = created.id
    }
  }

  // ── Lessons (upsert by slug; all are NOTE + published) ───────────────────
  const pythonLessons = getLessons()
  for (const l of pythonLessons) {
    const sectionId = sectionMap[l.sectionTitle]
    if (!sectionId) continue
    await prisma.lesson.upsert({
      where: { slug: l.lessonSlug },
      update: {
        sectionId,
        title: l.lessonTitle,
        contentType: 'NOTE' as ContentType,
        estimatedMinutes: l.estimatedMinutes,
        order: l.lessonOrder,
        isPublished: true,
        content: l.content,
      },
      create: {
        sectionId,
        title: l.lessonTitle,
        slug: l.lessonSlug,
        contentType: 'NOTE' as ContentType,
        estimatedMinutes: l.estimatedMinutes,
        order: l.lessonOrder,
        isPublished: true,
        content: l.content,
        description: null,
      },
    })
  }

  console.log(
    `✅ Learning: Programming category + Python roadmap (${sectionDefs.length} sections, ${pythonLessons.length} lessons)`
  )

  // ── Coding: Categories, Tags, Companies, Problems ────────────────────────────
  const problemCategories = [
    { name: 'Arrays & Strings', slug: 'arrays-strings', description: 'Array and string manipulation', displayOrder: 1 },
    { name: 'Linked Lists', slug: 'linked-lists', description: 'Singly and doubly linked lists', displayOrder: 2 },
    { name: 'Dynamic Programming', slug: 'dynamic-programming', description: 'DP problems and patterns', displayOrder: 3 },
    { name: 'Trees & Graphs', slug: 'trees-graphs', description: 'Tree and graph traversal', displayOrder: 4 },
  ]
  const pcMap: Record<string, string> = {}
  for (const pc of problemCategories) {
    const rec = await prisma.problemCategory.upsert({ where: { slug: pc.slug }, update: {}, create: pc })
    pcMap[pc.slug] = rec.id
  }

  const problemTags = [
    { name: 'Array', slug: 'array' }, { name: 'String', slug: 'string' },
    { name: 'Hash Table', slug: 'hash-table' }, { name: 'Two Pointers', slug: 'two-pointers' },
    { name: 'Dynamic Programming', slug: 'dp' }, { name: 'Recursion', slug: 'recursion' },
  ]
  const tagMap: Record<string, string> = {}
  for (const tag of problemTags) {
    const rec = await prisma.problemTag.upsert({ where: { slug: tag.slug }, update: {}, create: tag })
    tagMap[tag.slug] = rec.id
  }

  const companies = [
    { name: 'Google', slug: 'google', industry: 'Technology', headquarters: 'Mountain View, CA', website: 'https://google.com', verified: true },
    { name: 'Amazon', slug: 'amazon', industry: 'E-commerce / Cloud', headquarters: 'Seattle, WA', website: 'https://amazon.com', verified: true },
    { name: 'Microsoft', slug: 'microsoft', industry: 'Technology', headquarters: 'Redmond, WA', website: 'https://microsoft.com', verified: true },
    { name: 'Flipkart', slug: 'flipkart', industry: 'E-commerce', headquarters: 'Bangalore, India', website: 'https://flipkart.com', verified: true },
  ]
  const companyMap: Record<string, string> = {}
  for (const co of companies) {
    const rec = await prisma.company.upsert({ where: { slug: co.slug }, update: {}, create: co })
    companyMap[co.slug] = rec.id
  }

  const problems = [
    {
      categorySlug: 'arrays-strings', title: 'Two Sum', slug: 'two-sum',
      description: 'Find two numbers that add up to a target.',
      problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      inputFormat: 'First line: array. Second line: target.', outputFormat: 'Two indices.',
      constraints: '2 <= nums.length <= 10^4', sampleInput: '[2,7,11,15]\n9', sampleOutput: '[0,1]',
      difficulty: 'EASY' as const, points: 10, isPublished: true,
      tags: ['array', 'hash-table'], companies: ['google', 'amazon'],
      testCases: [
        { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isSample: true },
        { input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: true },
      ],
      templates: [
        { language: 'PYTHON' as const, template: 'def two_sum(nums, target):\n    pass' },
        { language: 'JAVASCRIPT' as const, template: 'function twoSum(nums, target) {}' },
      ],
    },
    {
      categorySlug: 'linked-lists', title: 'Reverse Linked List', slug: 'reverse-linked-list',
      description: 'Reverse a singly linked list.',
      problemStatement: 'Given the head of a singly linked list, reverse the list and return the reversed list.',
      constraints: '0 <= n <= 5000', sampleInput: '[1,2,3,4,5]', sampleOutput: '[5,4,3,2,1]',
      difficulty: 'EASY' as const, points: 10, isPublished: true,
      tags: ['recursion'], companies: ['microsoft'],
      testCases: [{ input: '[1,2,3]', expectedOutput: '[3,2,1]', isSample: true }],
      templates: [{ language: 'PYTHON' as const, template: 'def reverse_list(head):\n    pass' }],
    },
    {
      categorySlug: 'dynamic-programming', title: 'Climbing Stairs', slug: 'climbing-stairs',
      description: 'Count distinct ways to climb to the top.',
      problemStatement: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
      constraints: '1 <= n <= 45', sampleInput: '3', sampleOutput: '3',
      difficulty: 'MEDIUM' as const, points: 20, isPublished: false,
      tags: ['dp'], companies: ['amazon', 'flipkart'],
      testCases: [{ input: '2', expectedOutput: '2', isSample: true }],
      templates: [{ language: 'JAVA' as const, template: 'class Solution { int climbStairs(int n) { return 0; } }' }],
    },
  ]

  for (const p of problems) {
    const { categorySlug, tags, companies: cos, testCases, templates, ...fields } = p
    const problem = await prisma.codingProblem.upsert({
      where: { slug: fields.slug },
      update: {},
      create: { ...fields, categoryId: pcMap[categorySlug]! },
    })
    if ((await prisma.testCase.count({ where: { problemId: problem.id } })) === 0) {
      await prisma.testCase.createMany({ data: testCases.map((tc) => ({ ...tc, problemId: problem.id })) })
    }
    if ((await prisma.codeTemplate.count({ where: { problemId: problem.id } })) === 0) {
      await prisma.codeTemplate.createMany({ data: templates.map((t) => ({ ...t, problemId: problem.id })) })
    }
    await prisma.problemTagRelation.createMany({
      data: tags.map((t) => ({ problemId: problem.id, tagId: tagMap[t]! })),
      skipDuplicates: true,
    })
    await prisma.problemCompany.createMany({
      data: cos.map((c) => ({ problemId: problem.id, companyId: companyMap[c]! })),
      skipDuplicates: true,
    })
  }
  console.log(`✅ Coding: ${problemCategories.length} categories, ${problemTags.length} tags, ${companies.length} companies, ${problems.length} problems`)

  // ── Projects: Categories, Technologies, Projects ─────────────────────────────
  const projectCategories = [
    { name: 'Full Stack', slug: 'full-stack', description: 'End-to-end web applications', displayOrder: 1 },
    { name: 'Machine Learning', slug: 'machine-learning', description: 'ML and data science projects', displayOrder: 2 },
    { name: 'Mobile', slug: 'mobile', description: 'Android and iOS apps', displayOrder: 3 },
  ]
  const projCatMap: Record<string, string> = {}
  for (const pc of projectCategories) {
    const rec = await prisma.projectCategory.upsert({ where: { slug: pc.slug }, update: {}, create: pc })
    projCatMap[pc.slug] = rec.id
  }

  const technologies = [
    { name: 'React', slug: 'react' }, { name: 'Node.js', slug: 'nodejs' },
    { name: 'TypeScript', slug: 'typescript' }, { name: 'Python', slug: 'python' },
    { name: 'MongoDB', slug: 'mongodb' },
  ]
  const techMap: Record<string, string> = {}
  for (const t of technologies) {
    const rec = await prisma.projectTechnology.upsert({ where: { slug: t.slug }, update: {}, create: t })
    techMap[t.slug] = rec.id
  }

  const projects = [
    {
      categorySlug: 'full-stack', title: 'E-Commerce Platform', slug: 'ecommerce-platform',
      description: 'A full-stack e-commerce app with cart and payments.',
      difficulty: 'INTERMEDIATE' as const, estimatedDuration: '4 weeks', isPublished: true,
      technologies: ['react', 'nodejs', 'mongodb'],
    },
    {
      categorySlug: 'machine-learning', title: 'Movie Recommendation Engine', slug: 'movie-recommender',
      description: 'Build a collaborative-filtering recommender.',
      difficulty: 'ADVANCED' as const, estimatedDuration: '3 weeks', isPublished: false,
      technologies: ['python'],
    },
  ]
  for (const p of projects) {
    const { categorySlug, technologies: techs, ...fields } = p
    const project = await prisma.project.upsert({
      where: { slug: fields.slug },
      update: {},
      create: { ...fields, categoryId: projCatMap[categorySlug]! },
    })
    await prisma.projectTechnologyRelation.createMany({
      data: techs.map((t) => ({ projectId: project.id, technologyId: techMap[t]! })),
      skipDuplicates: true,
    })
  }
  console.log(`✅ Projects: ${projectCategories.length} categories, ${technologies.length} technologies, ${projects.length} projects`)

  // ── Placements: Job Postings ─────────────────────────────────────────────────
  const jobs = [
    { companySlug: 'google', title: 'Software Engineer Intern', type: 'INTERNSHIP' as const, workMode: 'ONSITE' as const, location: 'Bangalore', description: 'Summer 2026 SWE internship.', salaryRange: '₹1,00,000/month', isPublished: true },
    { companySlug: 'amazon', title: 'SDE-1', type: 'FULL_TIME' as const, workMode: 'HYBRID' as const, location: 'Hyderabad', description: 'Entry-level backend engineer.', salaryRange: '₹28 LPA', isPublished: true },
    { companySlug: 'flipkart', title: 'Frontend Engineer', type: 'FULL_TIME' as const, workMode: 'REMOTE' as const, location: 'Remote', description: 'React/TypeScript frontend role.', salaryRange: '₹22 LPA', isPublished: false },
  ]
  for (const j of jobs) {
    const { companySlug, ...fields } = j
    const companyId = companyMap[companySlug]!
    const exists = await prisma.jobPosting.findFirst({ where: { title: fields.title, companyId } })
    if (!exists) await prisma.jobPosting.create({ data: { ...fields, companyId } })
  }
  console.log(`✅ Placements: ${jobs.length} job postings`)

  // ── Events ────────────────────────────────────────────────────────────────
  const now = Date.now()
  const events = [
    { title: 'Intro to System Design Webinar', description: 'Live webinar covering system design basics.', type: 'WEBINAR' as const, organizer: 'CSE Platform', location: 'Online', startTime: new Date(now + 7 * 864e5), endTime: new Date(now + 7 * 864e5 + 2 * 36e5), maxParticipants: 500, isPublished: true },
    { title: 'CSE Annual Hackathon 2026', description: '24-hour hackathon with prizes.', type: 'HACKATHON' as const, organizer: 'CSE Platform', location: 'Campus Auditorium', startTime: new Date(now + 30 * 864e5), endTime: new Date(now + 31 * 864e5), maxParticipants: 200, isPublished: true },
  ]
  for (const e of events) {
    const exists = await prisma.event.findFirst({ where: { title: e.title } })
    if (!exists) await prisma.event.create({ data: e })
  }
  console.log(`✅ Events: ${events.length} events`)

  // ── FAQ ──────────────────────────────────────────────────────────────────
  const faqCategories = [
    { name: 'General', slug: 'general', displayOrder: 1 },
    { name: 'Placements', slug: 'placements', displayOrder: 2 },
  ]
  const faqCatMap: Record<string, string> = {}
  for (const fc of faqCategories) {
    const rec = await prisma.faqCategory.upsert({ where: { slug: fc.slug }, update: {}, create: fc })
    faqCatMap[fc.slug] = rec.id
  }
  const faqs = [
    { categorySlug: 'general', question: 'What is the CSE Platform?', answer: 'An all-in-one learning, coding, projects and placement platform.', isPublished: true, displayOrder: 1 },
    { categorySlug: 'general', question: 'Is it free to use?', answer: 'Yes, core features are free for students.', isPublished: true, displayOrder: 2 },
    { categorySlug: 'placements', question: 'How do I apply to jobs?', answer: 'Browse the Placements module and use the apply link.', isPublished: true, displayOrder: 1 },
  ]
  for (const f of faqs) {
    const { categorySlug, ...fields } = f
    const exists = await prisma.faq.findFirst({ where: { question: fields.question } })
    if (!exists) await prisma.faq.create({ data: { ...fields, categoryId: faqCatMap[categorySlug]!, createdBy } })
  }
  console.log(`✅ FAQ: ${faqCategories.length} categories, ${faqs.length} FAQs`)

  // ── Testimonials ───────────────────────────────────────────────────────────
  const testimonials = [
    { studentName: 'Priya Sharma', role: 'SDE @ Amazon', company: 'Amazon', content: 'The DSA roadmap and mock problems got me placed!', rating: 5, isFeatured: true, isPublished: true },
    { studentName: 'Rahul Verma', role: 'Frontend Dev @ Flipkart', company: 'Flipkart', content: 'Loved the project hub — real teamwork experience.', rating: 5, isFeatured: false, isPublished: true },
  ]
  for (const t of testimonials) {
    const exists = await prisma.testimonial.findFirst({ where: { studentName: t.studentName } })
    if (!exists) await prisma.testimonial.create({ data: { ...t, createdBy } })
  }
  console.log(`✅ Testimonials: ${testimonials.length}`)

  // ── Banners ────────────────────────────────────────────────────────────────
  const banners = [
    { title: 'Welcome to CSE Platform', placement: 'HOMEPAGE' as const, type: 'IMAGE' as const, mediaUrl: 'https://placehold.co/1200x300?text=Welcome', ctaText: 'Get Started', ctaLink: '/learning', priority: 10, isActive: true },
  ]
  for (const b of banners) {
    const exists = await prisma.banner.findFirst({ where: { title: b.title } })
    if (!exists) await prisma.banner.create({ data: { ...b, createdBy } })
  }
  console.log(`✅ Banners: ${banners.length}`)

  console.log('\n🎉 Seed complete!')
  console.log('─────────────────────────────────')
  console.log('Admin   → admin@cse.dev   / Admin@123')
  console.log('Manager → manager@cse.dev / Manager@123')
  console.log('Student → student@cse.dev / Student@123')
  console.log('─────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
