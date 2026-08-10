/**
 * Prisma Seed Script
 *
 * Seeds accounts (Admin, Manager, Student) and baseline CMS content so that the
 * Manager Console is fully testable end-to-end with real PostgreSQL data:
 *   - Learning:   Courses → Levels → LearningContent (NEW Learning CMS)
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

import { PrismaClient, Role, ContentType, CourseStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Seeding is a one-off script: connect via the DIRECT (non-pooled) connection.
// The runtime DATABASE_URL points at the Supabase transaction pooler (PgBouncer,
// port 6543) which does not support Prisma's prepared statements across repeated
// runs — re-running the seed there fails with `prepared statement "s0" already
// exists` (Postgres 42P05). DIRECT_URL (port 5432) avoids that entirely.
const seedDbUrl = process.env['DIRECT_URL'] || process.env['DATABASE_URL'];

const prisma = new PrismaClient({
  datasources: { db: { url: seedDbUrl } },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function upsertUser(opts: {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  extra?: Record<string, unknown>;
}) {
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
  'LEARNING',
  'CODING',
  'PROJECTS',
  'PLACEMENTS',
  'EVENTS',
  'NOTIFICATIONS',
  'REPORTS',
] as const;

async function grantAllPermissions(managerId: string) {
  for (const module of PERMISSION_MODULES) {
    await prisma.managerPermission.upsert({
      where: { managerId_module: { managerId, module } },
      update: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canPublish: true,
      },
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
  console.log('🌱 Seeding database...');

  // ── Accounts ───────────────────────────────────────────────────────────────
  const admin = await upsertUser({
    email: 'admin@cse.dev',
    password: 'Admin@123',
    fullName: 'Platform Admin',
    role: Role.SUPER_ADMIN,
  });
  console.log(`✅ Admin:   admin@cse.dev / Admin@123`);

  const manager = await upsertUser({
    email: 'manager@cse.dev',
    password: 'Manager@123',
    fullName: 'Content Manager',
    role: Role.MANAGER,
  });
  await grantAllPermissions(manager.id);
  console.log(`✅ Manager: manager@cse.dev / Manager@123 (all module permissions)`);

  await upsertUser({
    email: 'student@cse.dev',
    password: 'Student@123',
    fullName: 'Test Student',
    role: Role.STUDENT,
    extra: { branch: 'Computer Science', currentYear: 3, collegeName: 'CSE College' },
  });
  console.log(`✅ Student: student@cse.dev / Student@123`);

  const createdBy = manager.id;

  // ── Coding: Categories, Tags, Companies, Problems ──────────────────────────
  // ── FPRD-16: Coding — 31 Topics (Question Bank) + Tags + Companies ──────────────────
  // Demo problems removed per FPRD-16. Questions will be imported separately.
  const problemCategories = [
    {
      name: 'Arrays',
      slug: 'arrays',
      description: 'Array manipulation and traversal',
      displayOrder: 1,
    },
    {
      name: 'Strings',
      slug: 'strings',
      description: 'String processing and pattern matching',
      displayOrder: 2,
    },
    {
      name: 'Linked List',
      slug: 'linked-list',
      description: 'Singly and doubly linked lists',
      displayOrder: 3,
    },
    {
      name: 'Stack',
      slug: 'stack',
      description: 'Stack-based problems and patterns',
      displayOrder: 4,
    },
    { name: 'Queue', slug: 'queue', description: 'Queue-based problems and BFS', displayOrder: 5 },
    { name: 'Trees', slug: 'trees', description: 'Binary trees and N-ary trees', displayOrder: 6 },
    {
      name: 'Binary Search Tree',
      slug: 'binary-search-tree',
      description: 'BST operations and properties',
      displayOrder: 7,
    },
    {
      name: 'Binary Tree',
      slug: 'binary-tree',
      description: 'Binary tree traversals and algorithms',
      displayOrder: 8,
    },
    {
      name: 'Graph',
      slug: 'graph',
      description: 'Graph traversal, shortest paths, and more',
      displayOrder: 9,
    },
    {
      name: 'Dynamic Programming',
      slug: 'dynamic-programming',
      description: 'DP problems and patterns',
      displayOrder: 10,
    },
    { name: 'Greedy', slug: 'greedy', description: 'Greedy algorithm problems', displayOrder: 11 },
    {
      name: 'Recursion',
      slug: 'recursion',
      description: 'Recursive thinking and backtracking',
      displayOrder: 12,
    },
    {
      name: 'Hashing',
      slug: 'hashing',
      description: 'HashMap and HashSet problems',
      displayOrder: 13,
    },
    {
      name: 'Heap',
      slug: 'heap',
      description: 'Priority queue and heap problems',
      displayOrder: 14,
    },
    {
      name: 'Sliding Window',
      slug: 'sliding-window',
      description: 'Sliding window technique',
      displayOrder: 15,
    },
    {
      name: 'Two Pointer',
      slug: 'two-pointer',
      description: 'Two pointer technique',
      displayOrder: 16,
    },
    {
      name: 'Prefix Sum',
      slug: 'prefix-sum',
      description: 'Prefix sum and range queries',
      displayOrder: 17,
    },
    {
      name: 'Bit Manipulation',
      slug: 'bit-manipulation',
      description: 'Bitwise operations and tricks',
      displayOrder: 18,
    },
    {
      name: 'Backtracking',
      slug: 'backtracking',
      description: 'Backtracking and constraint satisfaction',
      displayOrder: 19,
    },
    { name: 'Trie', slug: 'trie', description: 'Trie data structure problems', displayOrder: 20 },
    {
      name: 'Matrix',
      slug: 'matrix',
      description: '2D array and matrix problems',
      displayOrder: 21,
    },
    {
      name: 'Sorting',
      slug: 'sorting',
      description: 'Sorting algorithms and applications',
      displayOrder: 22,
    },
    { name: 'Searching', slug: 'searching', description: 'Search algorithms', displayOrder: 23 },
    {
      name: 'Math',
      slug: 'math',
      description: 'Mathematical problems and proofs',
      displayOrder: 24,
    },
    {
      name: 'Number Theory',
      slug: 'number-theory',
      description: 'Primes, GCD, modular arithmetic',
      displayOrder: 25,
    },
    {
      name: 'Geometry',
      slug: 'geometry',
      description: 'Computational geometry problems',
      displayOrder: 26,
    },
    {
      name: 'Simulation',
      slug: 'simulation',
      description: 'Simulation-based problems',
      displayOrder: 27,
    },
    {
      name: 'Binary Search',
      slug: 'binary-search',
      description: 'Binary search on sorted arrays and answer space',
      displayOrder: 28,
    },
    {
      name: 'Divide and Conquer',
      slug: 'divide-and-conquer',
      description: 'Divide and conquer algorithms',
      displayOrder: 29,
    },
    {
      name: 'Segment Tree',
      slug: 'segment-tree',
      description: 'Segment tree range queries',
      displayOrder: 30,
    },
    {
      name: 'Fenwick Tree',
      slug: 'fenwick-tree',
      description: 'Binary indexed tree / Fenwick tree',
      displayOrder: 31,
    },
  ];
  const pcMap: Record<string, string> = {};
  for (const pc of problemCategories) {
    const rec = await prisma.problemCategory.upsert({
      where: { slug: pc.slug },
      update: { displayOrder: pc.displayOrder, description: pc.description },
      create: pc,
    });
    pcMap[pc.slug] = rec.id;
  }
  // Deactivate legacy categories that are replaced by the new topic structure
  await prisma.problemCategory.updateMany({
    where: { slug: { in: ['arrays-strings', 'linked-lists', 'trees-graphs'] } },
    data: { isActive: false },
  });

  const problemTags = [
    { name: 'Array', slug: 'array' },
    { name: 'String', slug: 'string' },
    { name: 'Hash Table', slug: 'hash-table' },
    { name: 'Two Pointers', slug: 'two-pointers' },
    { name: 'Dynamic Programming', slug: 'dp' },
    { name: 'Recursion', slug: 'recursion' },
    { name: 'Binary Search', slug: 'binary-search-tag' },
    { name: 'Graph', slug: 'graph-tag' },
    { name: 'Tree', slug: 'tree-tag' },
    { name: 'Greedy', slug: 'greedy-tag' },
    { name: 'Sliding Window', slug: 'sliding-window-tag' },
    { name: 'HashMap', slug: 'hashmap' },
  ];
  for (const tag of problemTags) {
    await prisma.problemTag.upsert({ where: { slug: tag.slug }, update: {}, create: tag });
  }

  const companies = [
    {
      name: 'Google',
      slug: 'google',
      industry: 'Technology',
      headquarters: 'Mountain View, CA',
      website: 'https://google.com',
      verified: true,
    },
    {
      name: 'Amazon',
      slug: 'amazon',
      industry: 'E-commerce / Cloud',
      headquarters: 'Seattle, WA',
      website: 'https://amazon.com',
      verified: true,
    },
    {
      name: 'Microsoft',
      slug: 'microsoft',
      industry: 'Technology',
      headquarters: 'Redmond, WA',
      website: 'https://microsoft.com',
      verified: true,
    },
    {
      name: 'Meta',
      slug: 'meta',
      industry: 'Technology',
      headquarters: 'Menlo Park, CA',
      website: 'https://meta.com',
      verified: true,
    },
    {
      name: 'Adobe',
      slug: 'adobe',
      industry: 'Technology',
      headquarters: 'San Jose, CA',
      website: 'https://adobe.com',
      verified: true,
    },
    {
      name: 'Oracle',
      slug: 'oracle',
      industry: 'Technology',
      headquarters: 'Austin, TX',
      website: 'https://oracle.com',
      verified: true,
    },
    {
      name: 'Apple',
      slug: 'apple',
      industry: 'Technology',
      headquarters: 'Cupertino, CA',
      website: 'https://apple.com',
      verified: true,
    },
    {
      name: 'Flipkart',
      slug: 'flipkart',
      industry: 'E-commerce',
      headquarters: 'Bangalore, India',
      website: 'https://flipkart.com',
      verified: true,
    },
    {
      name: 'Netflix',
      slug: 'netflix',
      industry: 'Entertainment',
      headquarters: 'Los Gatos, CA',
      website: 'https://netflix.com',
      verified: true,
    },
    {
      name: 'Uber',
      slug: 'uber',
      industry: 'Ride-sharing',
      headquarters: 'San Francisco, CA',
      website: 'https://uber.com',
      verified: true,
    },
  ];
  const companyMap: Record<string, string> = {};
  for (const co of companies) {
    const rec = await prisma.company.upsert({ where: { slug: co.slug }, update: {}, create: co });
    companyMap[co.slug] = rec.id;
  }

  // FPRD-16: NO demo problems seeded — Question Bank uses empty states until real dataset is imported.
  // The dataset will be imported separately via a bulk import script.
  console.log(
    `✅ Coding: ${problemCategories.length} topics (Question Bank), ${problemTags.length} tags, ${companies.length} companies — no demo questions (FPRD-16)`,
  );
  const projectCategories = [
    {
      name: 'Full Stack',
      slug: 'full-stack',
      description: 'End-to-end web applications',
      displayOrder: 1,
    },
    {
      name: 'Machine Learning',
      slug: 'machine-learning',
      description: 'ML and data science projects',
      displayOrder: 2,
    },
    { name: 'Mobile', slug: 'mobile', description: 'Android and iOS apps', displayOrder: 3 },
  ];
  const projCatMap: Record<string, string> = {};
  for (const pc of projectCategories) {
    const rec = await prisma.projectCategory.upsert({
      where: { slug: pc.slug },
      update: {},
      create: pc,
    });
    projCatMap[pc.slug] = rec.id;
  }

  const technologies = [
    { name: 'React', slug: 'react' },
    { name: 'Node.js', slug: 'nodejs' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'Python', slug: 'python' },
    { name: 'MongoDB', slug: 'mongodb' },
  ];
  const techMap: Record<string, string> = {};
  for (const t of technologies) {
    const rec = await prisma.projectTechnology.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
    techMap[t.slug] = rec.id;
  }

  const projects = [
    {
      categorySlug: 'full-stack',
      title: 'E-Commerce Platform',
      slug: 'ecommerce-platform',
      description: 'A full-stack e-commerce app with cart and payments.',
      difficulty: 'INTERMEDIATE' as const,
      estimatedDuration: '4 weeks',
      isPublished: true,
      technologies: ['react', 'nodejs', 'mongodb'],
    },
    {
      categorySlug: 'machine-learning',
      title: 'Movie Recommendation Engine',
      slug: 'movie-recommender',
      description: 'Build a collaborative-filtering recommender.',
      difficulty: 'ADVANCED' as const,
      estimatedDuration: '3 weeks',
      isPublished: false,
      technologies: ['python'],
    },
  ];
  for (const p of projects) {
    const { categorySlug, technologies: techs, ...fields } = p;
    const project = await prisma.project.upsert({
      where: { slug: fields.slug },
      update: {},
      create: { ...fields, categoryId: projCatMap[categorySlug]! },
    });
    await prisma.projectTechnologyRelation.createMany({
      data: techs.map((t) => ({ projectId: project.id, technologyId: techMap[t]! })),
      skipDuplicates: true,
    });
  }
  console.log(
    `✅ Projects: ${projectCategories.length} categories, ${technologies.length} technologies, ${projects.length} projects`,
  );

  // ── Placements: Job Postings ───────────────────────────────────────────────
  const jobs = [
    {
      companySlug: 'google',
      title: 'Software Engineer Intern',
      type: 'INTERNSHIP' as const,
      workMode: 'ONSITE' as const,
      location: 'Bangalore',
      description: 'Summer 2026 SWE internship.',
      salaryRange: '₹1,00,000/month',
      isPublished: true,
    },
    {
      companySlug: 'amazon',
      title: 'SDE-1',
      type: 'FULL_TIME' as const,
      workMode: 'HYBRID' as const,
      location: 'Hyderabad',
      description: 'Entry-level backend engineer.',
      salaryRange: '₹28 LPA',
      isPublished: true,
    },
    {
      companySlug: 'flipkart',
      title: 'Frontend Engineer',
      type: 'FULL_TIME' as const,
      workMode: 'REMOTE' as const,
      location: 'Remote',
      description: 'React/TypeScript frontend role.',
      salaryRange: '₹22 LPA',
      isPublished: false,
    },
  ];
  for (const j of jobs) {
    const { companySlug, ...fields } = j;
    const companyId = companyMap[companySlug]!;
    const exists = await prisma.jobPosting.findFirst({ where: { title: fields.title, companyId } });
    if (!exists) await prisma.jobPosting.create({ data: { ...fields, companyId } });
  }
  console.log(`✅ Placements: ${jobs.length} job postings`);

  // ── Events ─────────────────────────────────────────────────────────────────
  const now = Date.now();
  const events = [
    {
      title: 'Intro to System Design Webinar',
      description: 'Live webinar covering system design basics.',
      type: 'WEBINAR' as const,
      organizer: 'CSE Platform',
      location: 'Online',
      startTime: new Date(now + 7 * 864e5),
      endTime: new Date(now + 7 * 864e5 + 2 * 36e5),
      maxParticipants: 500,
      isPublished: true,
    },
    {
      title: 'CSE Annual Hackathon 2026',
      description: '24-hour hackathon with prizes.',
      type: 'HACKATHON' as const,
      organizer: 'CSE Platform',
      location: 'Campus Auditorium',
      startTime: new Date(now + 30 * 864e5),
      endTime: new Date(now + 31 * 864e5),
      maxParticipants: 200,
      isPublished: true,
    },
  ];
  for (const e of events) {
    const exists = await prisma.event.findFirst({ where: { title: e.title } });
    if (!exists) await prisma.event.create({ data: e });
  }
  console.log(`✅ Events: ${events.length} events`);

  // ── FAQ ────────────────────────────────────────────────────────────────────
  const faqCategories = [
    { name: 'General', slug: 'general', displayOrder: 1 },
    { name: 'Placements', slug: 'placements', displayOrder: 2 },
  ];
  const faqCatMap: Record<string, string> = {};
  for (const fc of faqCategories) {
    const rec = await prisma.faqCategory.upsert({
      where: { slug: fc.slug },
      update: {},
      create: fc,
    });
    faqCatMap[fc.slug] = rec.id;
  }
  const faqs = [
    {
      categorySlug: 'general',
      question: 'What is the CSE Platform?',
      answer: 'An all-in-one learning, coding, projects and placement platform.',
      isPublished: true,
      displayOrder: 1,
    },
    {
      categorySlug: 'general',
      question: 'Is it free to use?',
      answer: 'Yes, core features are free for students.',
      isPublished: true,
      displayOrder: 2,
    },
    {
      categorySlug: 'placements',
      question: 'How do I apply to jobs?',
      answer: 'Browse the Placements module and use the apply link.',
      isPublished: true,
      displayOrder: 1,
    },
  ];
  for (const f of faqs) {
    const { categorySlug, ...fields } = f;
    const exists = await prisma.faq.findFirst({ where: { question: fields.question } });
    if (!exists)
      await prisma.faq.create({
        data: { ...fields, categoryId: faqCatMap[categorySlug]!, createdBy },
      });
  }
  console.log(`✅ FAQ: ${faqCategories.length} categories, ${faqs.length} FAQs`);

  // ── Testimonials ───────────────────────────────────────────────────────────
  const testimonials = [
    {
      studentName: 'Priya Sharma',
      role: 'SDE @ Amazon',
      company: 'Amazon',
      content: 'The DSA roadmap and mock problems got me placed!',
      rating: 5,
      isFeatured: true,
      isPublished: true,
    },
    {
      studentName: 'Rahul Verma',
      role: 'Frontend Dev @ Flipkart',
      company: 'Flipkart',
      content: 'Loved the project hub — real teamwork experience.',
      rating: 5,
      isFeatured: false,
      isPublished: true,
    },
  ];
  for (const t of testimonials) {
    const exists = await prisma.testimonial.findFirst({ where: { studentName: t.studentName } });
    if (!exists) await prisma.testimonial.create({ data: { ...t, createdBy } });
  }
  console.log(`✅ Testimonials: ${testimonials.length}`);

  // ── Banners ────────────────────────────────────────────────────────────────
  const banners = [
    {
      title: 'Welcome to CSE Platform',
      placement: 'HOMEPAGE' as const,
      type: 'IMAGE' as const,
      mediaUrl: 'https://placehold.co/1200x300?text=Welcome',
      ctaText: 'Get Started',
      ctaLink: '/learning',
      priority: 10,
      isActive: true,
    },
  ];
  for (const b of banners) {
    const exists = await prisma.banner.findFirst({ where: { title: b.title } });
    if (!exists) await prisma.banner.create({ data: { ...b, createdBy } });
  }
  console.log(`✅ Banners: ${banners.length}`);

  // ── Learning CMS (NEW): Course → Levels → LearningContent ─────────────────

  // Upsert Super Admin reference (already done above; reuse admin.id)
  const sa = await prisma.user.findUnique({ where: { email: 'admin@cse.dev' } });
  const saId = sa?.id ?? admin.id;

  // 1 Course: Python Crash Course (PUBLISHED)
  const course = await prisma.course.upsert({
    where: { slug: 'python-crash-course' },
    update: {
      title: 'Python Crash Course',
      status: CourseStatus.PUBLISHED,
      description: 'A fast-paced introduction to Python programming for beginners.',
      totalDays: 3,
      createdBy: saId,
    },
    create: {
      title: 'Python Crash Course',
      slug: 'python-crash-course',
      description: 'A fast-paced introduction to Python programming for beginners.',
      status: CourseStatus.PUBLISHED,
      totalDays: 3,
      createdBy: saId,
    },
  });

  // 2 Levels under the course
  const level00 = await prisma.level.upsert({
    where: { courseId_levelNumber: { courseId: course.id, levelNumber: 0 } },
    update: {
      title: 'Getting Started',
      order: 1,
      status: CourseStatus.PUBLISHED,
      youtubeUrl: null,
      description: 'Introduction to programming and setting up Python.',
      createdBy: saId,
    },
    create: {
      courseId: course.id,
      levelNumber: 0,
      title: 'Getting Started',
      description: 'Introduction to programming and setting up Python.',
      order: 1,
      status: CourseStatus.PUBLISHED,
      youtubeUrl: null,
      createdBy: saId,
    },
  });

  const level01 = await prisma.level.upsert({
    where: { courseId_levelNumber: { courseId: course.id, levelNumber: 1 } },
    update: {
      title: 'Python Fundamentals',
      order: 2,
      status: CourseStatus.PUBLISHED,
      youtubeUrl: null,
      description: 'Core Python syntax and basic building blocks.',
      createdBy: saId,
    },
    create: {
      courseId: course.id,
      levelNumber: 1,
      title: 'Python Fundamentals',
      description: 'Core Python syntax and basic building blocks.',
      order: 2,
      status: CourseStatus.PUBLISHED,
      youtubeUrl: null,
      createdBy: saId,
    },
  });

  // Helper: slugify a topic name
  function slugify(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9\s-?]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  // 3 LearningContent rows under Level 00 (dayNumber 1..3, published=true)
  const sampleDays: { dayNumber: 1 | 2 | 3; topic: string; description: string }[] = [
    {
      dayNumber: 1,
      topic: 'What is Programming?',
      description:
        'An introduction to what programming is, how computers follow instructions, and why it matters.',
    },
    {
      dayNumber: 2,
      topic: 'What is a Programming Language?',
      description:
        'Understand programming languages, compilers vs interpreters, and how Python fits in.',
    },
    {
      dayNumber: 3,
      topic: 'Why Python?',
      description:
        'Discover what makes Python popular — readability, ecosystem, use cases and career prospects.',
    },
  ];

  for (const d of sampleDays) {
    const contentSlug = slugify(d.topic);
    await prisma.learningContent.upsert({
      where: { slug: contentSlug },
      update: {
        courseId: course.id,
        levelId: level00.id,
        dayNumber: d.dayNumber,
        topicName: d.topic,
        description: d.description,
        published: true,
        order: d.dayNumber,
        createdBy: saId,
      },
      create: {
        courseId: course.id,
        levelId: level00.id,
        dayNumber: d.dayNumber,
        topicName: d.topic,
        slug: contentSlug,
        description: d.description,
        published: true,
        order: d.dayNumber,
        createdBy: saId,
      },
    });
  }

  console.log(
    `✅ Learning CMS: Course "Python Crash Course" (1 course, 2 levels, 3 sample days under Level 00)`,
  );

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────────────────────');
  console.log('Admin   → admin@cse.dev   / Admin@123');
  console.log('Manager → manager@cse.dev / Manager@123');
  console.log('Student → student@cse.dev / Student@123');
  console.log('─────────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
