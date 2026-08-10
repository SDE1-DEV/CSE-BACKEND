#!/usr/bin/env node
/**
 * verify-production-schema.js
 * Checks that all expected tables exist in production after migration.
 * Run: node scripts/verify-production-schema.js
 */
'use strict';

const { PrismaClient } = require('@prisma/client');

const CMS_TABLES = [
  'courses',
  'levels',
  'learning_contents',
  'learning_note_images',
  'learning_progress',
];

const CORE_TABLES = [
  'users',
  'refresh_tokens',
  'email_verifications',
  'password_resets',
  'coding_problems',
  'submissions',
  'projects',
  'teams',
  'job_postings',
  'companies',
  'events',
  'notifications',
  '_prisma_migrations',
];

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });

  try {
    await prisma.$connect();
    console.log('[verify] Connected to production database.\n');

    const rows = await prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    const existing = new Set(rows.map((r) => r.table_name));

    // ── CMS tables ──────────────────────────────────────────────────────────
    console.log('=== Learning CMS Tables (must ALL exist) ===');
    let cmsFailed = 0;
    for (const t of CMS_TABLES) {
      const ok = existing.has(t);
      console.log(`  ${ok ? '✓' : '✗'} ${t}`);
      if (!ok) cmsFailed++;
    }

    // ── Core tables ──────────────────────────────────────────────────────────
    console.log('\n=== Core Tables (must ALL exist) ===');
    let coreFailed = 0;
    for (const t of CORE_TABLES) {
      const ok = existing.has(t);
      console.log(`  ${ok ? '✓' : '✗'} ${t}`);
      if (!ok) coreFailed++;
    }

    // ── Row counts for data preservation check ────────────────────────────
    console.log('\n=== Row Counts (data preservation check) ===');
    const countTables = ['users', 'coding_problems', 'submissions', 'companies', 'events', 'projects'];
    for (const t of countTables) {
      if (existing.has(t)) {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS cnt FROM "${t}"`);
        console.log(`  ${t}: ${result[0].cnt} rows`);
      }
    }

    // ── Migration history ─────────────────────────────────────────────────
    console.log('\n=== Migration History (_prisma_migrations) ===');
    if (existing.has('_prisma_migrations')) {
      const migrations = await prisma.$queryRawUnsafe(
        'SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY finished_at'
      );
      migrations.forEach((m) => {
        console.log(`  ${m.finished_at ? '✓ APPLIED' : '✗ FAILED '} ${m.migration_name}`);
      });
    } else {
      console.log('  ✗ _prisma_migrations table not found!');
    }

    // ── All public tables ─────────────────────────────────────────────────
    console.log('\n=== All Public Tables ===');
    Array.from(existing).sort().forEach((t) => console.log(`  - ${t}`));

    console.log('\n=== SUMMARY ===');
    if (cmsFailed === 0 && coreFailed === 0) {
      console.log('  ✓ ALL checks passed. Production schema is correct.');
    } else {
      console.log(`  ✗ ${cmsFailed} CMS table(s) missing`);
      console.log(`  ✗ ${coreFailed} core table(s) missing`);
      process.exit(1);
    }

  } catch (err) {
    console.error('[verify] ERROR:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main();
