/**
 * FPRD-18 — Bulk Dataset Import Script
 *
 * Imports all problem JSON files from the datasets/problems/ directory
 * directly into the database using the DatasetImportService pipeline.
 *
 * Usage:
 *   npx ts-node scripts/import-dataset.ts                    # import all topics
 *   npx ts-node scripts/import-dataset.ts --file arrays.json # import one file
 *   npx ts-node scripts/import-dataset.ts --publish          # publish after import
 *   npx ts-node scripts/import-dataset.ts --dry-run          # validate only
 *
 * This script bypasses HTTP auth and calls the service directly.
 * It uses DIRECT_URL to avoid PgBouncer prepared-statement issues.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load env before importing prisma
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Override DATABASE_URL with DIRECT_URL to avoid pooler issues in scripts
if (process.env['DIRECT_URL']) {
  process.env['DATABASE_URL'] = process.env['DIRECT_URL'];
}

import { PrismaClient } from '@prisma/client';
import { datasetImportService, ImportProblemSchema } from '../src/services/dataset-import.service';

const prisma = new PrismaClient();

const DATASETS_DIR = path.join(__dirname, '..', 'datasets', 'problems');

// Parse CLI flags
const args = process.argv.slice(2);
const fileArg = args.find((a) => a.startsWith('--file='))?.split('=')[1]
  ?? (args.indexOf('--file') !== -1 ? args[args.indexOf('--file') + 1] : null);
const publishAfter = args.includes('--publish');
const dryRun = args.includes('--dry-run');

async function getOrCreateSystemUser(): Promise<string> {
  // Find the super admin user to use as importedBy
  const admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    select: { id: true },
  });
  if (!admin) {
    throw new Error('No SUPER_ADMIN user found. Run the seed script first: npm run seed');
  }
  return admin.id;
}

async function importFile(filePath: string, userId: string): Promise<void> {
  const filename = path.basename(filePath);
  console.log(`\n📂 Importing: ${filename}`);

  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`  ✗ Cannot read file: ${(err as Error).message}`);
    return;
  }

  let problems: ImportProblemSchema[];
  try {
    const parsed = JSON.parse(raw);
    problems = Array.isArray(parsed) ? parsed : parsed.problems;
    if (!Array.isArray(problems)) throw new Error('Expected array of problems');
  } catch (err) {
    console.error(`  ✗ Invalid JSON: ${(err as Error).message}`);
    return;
  }

  console.log(`  Found ${problems.length} problems`);

  if (dryRun) {
    let valid = 0;
    let invalid = 0;
    for (const p of problems) {
      if (!p.title || !p.statement || !p.difficulty || !p.topic || !p.visibleTests?.length) {
        console.warn(`  ⚠ Invalid: "${p.title ?? 'unknown'}" — missing required fields`);
        invalid++;
      } else {
        valid++;
      }
    }
    console.log(`  [Dry Run] Valid: ${valid}, Invalid: ${invalid}`);
    return;
  }

  const report = await datasetImportService.importProblems(
    problems,
    userId,
    'ORIGINAL',
    filename,
  );

  console.log(`  ✓ Imported: ${report.imported}/${report.total}`);
  if (report.skipped > 0) {
    console.log(`  ⚡ Skipped (duplicates): ${report.skipped}`);
  }
  if (report.failed > 0) {
    console.log(`  ✗ Failed: ${report.failed}`);
    for (const e of report.errors.slice(0, 5)) {
      console.log(`    [${e.index}] "${e.title}": ${e.reason}`);
    }
    if (report.errors.length > 5) {
      console.log(`    ... and ${report.errors.length - 5} more errors`);
    }
  }

  // Publish all imported problems if --publish flag is set
  if (publishAfter && report.slugsCreated.length > 0) {
    const published = await prisma.codingProblem.updateMany({
      where: { slug: { in: report.slugsCreated } },
      data: { isPublished: true },
    });
    console.log(`  📢 Published: ${published.count} problems`);
  }
}

async function main() {
  console.log('🚀 CSE Platform — Dataset Import');
  console.log('=================================');

  if (dryRun) {
    console.log('  [DRY RUN MODE] No data will be written to the database.\n');
  }

  const userId = await getOrCreateSystemUser();
  console.log(`  Using admin user: ${userId}\n`);

  let filesToProcess: string[];

  if (fileArg) {
    // Single file mode
    const filePath = path.isAbsolute(fileArg)
      ? fileArg
      : fs.existsSync(fileArg)
        ? path.resolve(fileArg)
        : path.join(DATASETS_DIR, fileArg);

    if (!fs.existsSync(filePath)) {
      console.error(`✗ File not found: ${filePath}`);
      process.exit(1);
    }
    filesToProcess = [filePath];
  } else {
    // All files in datasets/problems/
    if (!fs.existsSync(DATASETS_DIR)) {
      console.error(`✗ Datasets directory not found: ${DATASETS_DIR}`);
      console.error('  Create it with: mkdir -p datasets/problems');
      process.exit(1);
    }
    filesToProcess = fs
      .readdirSync(DATASETS_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.join(DATASETS_DIR, f));

    if (filesToProcess.length === 0) {
      console.log('⚠ No JSON files found in datasets/problems/');
      process.exit(0);
    }
    console.log(`Found ${filesToProcess.length} dataset files to process.\n`);
  }

  let totalImported = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const filePath of filesToProcess) {
    await importFile(filePath, userId);
  }

  // Final summary
  const [totalProblems, totalTests] = await Promise.all([
    prisma.codingProblem.count({ where: { deletedAt: null } }),
    prisma.testCase.count(),
  ]);

  console.log('\n=================================');
  console.log('✅ Import Complete');
  console.log(`   Total problems in DB: ${totalProblems}`);
  console.log(`   Total test cases in DB: ${totalTests}`);

  if (publishAfter) {
    const published = await prisma.codingProblem.count({ where: { isPublished: true, deletedAt: null } });
    console.log(`   Published problems: ${published}`);
  } else {
    console.log('   ℹ Problems are imported as unpublished. Use --publish flag or publish via Manager Console.');
  }
}

main()
  .catch((err) => {
    console.error('\n✗ Import failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
