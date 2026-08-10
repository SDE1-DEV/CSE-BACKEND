#!/usr/bin/env node
/**
 * baseline-migrations.js
 *
 * PURPOSE
 * -------
 * Resolves P3005 "database schema is not empty" by establishing Prisma migration
 * history for the 13 migrations that already exist in production.
 *
 * HOW IT WORKS
 * ------------
 * 1. Connect to the production DB using the Prisma client (no extra pg dep needed).
 * 2. Check whether _prisma_migrations table exists.
 * 3. For each migration NOT already recorded, run:
 *      npx prisma migrate resolve --applied <migration-name>
 *    This marks the migration as applied WITHOUT executing its SQL.
 * 4. Leaves migration 20260810000000_learning_cms PENDING so that
 *    `prisma migrate deploy` will execute it and create the CMS tables.
 *
 * SAFETY
 * ------
 * - NEVER runs destructive SQL.
 * - NEVER resets the database.
 * - NEVER marks learning_cms as applied (its tables don't exist yet).
 * - Idempotent: safe to run multiple times.
 *
 * USAGE (called automatically by start:prod)
 * -------------------------------------------
 *   node scripts/baseline-migrations.js
 */

'use strict';

const { execSync }    = require('child_process');
const { PrismaClient } = require('@prisma/client');

// ── The 13 migrations that already represent the production schema ─────────────
// Migration 14 (learning_cms) is intentionally EXCLUDED — it must remain pending.
const EXISTING_MIGRATIONS = [
  '20260715122610_init',
  '20260715123406_learning_ecosystem',
  '20260715131433_coding_practice_platform',
  '20260715132426_project_hub_team_collaboration',
  '20260716055339_prd05_placement_ecosystem',
  '20260716220817_prd07_role_management_manager_console',
  '20260717120226_fprd10_cms_banners_faq_media_versions',
  '20260717175943_fprd10_lesson_content_roadmap_seo',
  '20260719120000_fprd11_soft_delete',
  '20260801000000_quiz_practice_tables',
  '20260801000001_add_missing_columns',
  '20260802000000_fprd17_online_judge',
  '20260805000000_fprd23_profile_system',
];

// ── The new migration that must be EXECUTED (not baselined) ───────────────────
const NEW_MIGRATION = '20260810000000_learning_cms';

async function main() {
  // Use DIRECT_URL if available — bypasses PgBouncer which causes
  // "prepared statement already exists" errors on $queryRawUnsafe.
  // Falls back to DATABASE_URL if DIRECT_URL is not set.
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!directUrl) {
    console.error('[baseline] ERROR: Neither DIRECT_URL nor DATABASE_URL is set.');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: directUrl } },
  });

  try {
    console.log('[baseline] Connecting to production database via Prisma...');
    await prisma.$connect();
    console.log('[baseline] Connected.');

    // ── Step 1: Check if _prisma_migrations table exists ─────────────────────
    const tableCheck = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public'
         AND   table_name   = '_prisma_migrations'
       ) AS exists`
    );
    const migrationTableExists = tableCheck[0]?.exists === true;

    if (migrationTableExists) {
      console.log('[baseline] _prisma_migrations table EXISTS.');

      // ── Step 2: Read already-applied migrations ───────────────────────────
      const appliedResult = await prisma.$queryRawUnsafe(
        `SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL ORDER BY finished_at`
      );
      const applied = new Set(appliedResult.map((r) => r.migration_name));
      console.log(`[baseline] Found ${applied.size} already-applied migrations in _prisma_migrations.`);

      // ── Guard: if learning_cms is already applied, nothing to do ──────────
      if (applied.has(NEW_MIGRATION)) {
        console.log(`[baseline] ${NEW_MIGRATION} is already applied. Nothing to do.`);
        return;
      }

      // ── Baseline any missing existing migrations ───────────────────────────
      const missing = EXISTING_MIGRATIONS.filter((m) => !applied.has(m));
      if (missing.length === 0) {
        console.log('[baseline] All existing migrations already recorded. Baseline not needed.');
        return;
      }

      console.log(`[baseline] ${missing.length} migration(s) not yet recorded. Baselining...`);
      for (const migration of missing) {
        console.log(`[baseline]   -> marking as applied: ${migration}`);
        execSync(`npx prisma migrate resolve --applied "${migration}"`, { stdio: 'inherit' });
      }

    } else {
      console.log('[baseline] _prisma_migrations table does NOT exist.');
      console.log('[baseline] Prisma migrate deploy will create it. Baselining all 13 existing migrations...');

      for (const migration of EXISTING_MIGRATIONS) {
        console.log(`[baseline]   -> marking as applied: ${migration}`);
        execSync(`npx prisma migrate resolve --applied "${migration}"`, { stdio: 'inherit' });
      }
    }

    // ── Step 3: Verify learning_cms is still pending ──────────────────────────
    const verifyResult = await prisma.$queryRawUnsafe(
      `SELECT migration_name FROM "_prisma_migrations" WHERE migration_name = $1`,
      NEW_MIGRATION
    );

    if (verifyResult.length === 0) {
      console.log(`[baseline] CONFIRMED: ${NEW_MIGRATION} is PENDING — will be executed by prisma migrate deploy.`);
    } else {
      console.warn(`[baseline] WARNING: ${NEW_MIGRATION} appears in _prisma_migrations unexpectedly.`);
    }

    console.log('[baseline] Baseline complete. Production migration history established.');
    console.log('[baseline] Safe to proceed with: npx prisma migrate deploy');

  } catch (err) {
    console.error('[baseline] ERROR:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

main();
