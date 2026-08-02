/**
 * Fix problems imported without test cases/templates due to the tag upsert bug.
 * For each published problem with 0 test cases, finds it in the dataset files
 * and adds its test cases and templates.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (process.env['DIRECT_URL']) process.env['DATABASE_URL'] = process.env['DIRECT_URL'];

import { PrismaClient, ProgrammingLanguage } from '@prisma/client';
import { LANGUAGE_CONFIGS } from '../src/services/execution';

const prisma = new PrismaClient();

interface ProblemDef {
  slug: string;
  visibleTests?: Array<{ input: string; output: string }>;
  hiddenTests?: Array<{ input: string; output: string }>;
  starterCode?: Partial<Record<string, string>>;
}

async function main() {
  // Find all published problems missing test cases
  const broken = await prisma.codingProblem.findMany({
    where: { isPublished: true, deletedAt: null, testCases: { none: {} } },
    select: { id: true, slug: true },
  });

  if (broken.length === 0) {
    console.log('✅ No problems with missing test cases found.');
    return;
  }

  console.log(`Found ${broken.length} problems without test cases. Fixing...\n`);

  // Build a lookup map from all dataset files
  const datasetDir = path.join(__dirname, '..', 'datasets', 'problems');
  const problemMap = new Map<string, ProblemDef>();

  for (const file of fs.readdirSync(datasetDir).filter(f => f.endsWith('.json'))) {
    const problems: ProblemDef[] = JSON.parse(fs.readFileSync(path.join(datasetDir, file), 'utf-8'));
    for (const p of problems) {
      problemMap.set(p.slug, p);
    }
  }

  const languages: ProgrammingLanguage[] = [
    'PYTHON', 'JAVA', 'CPP', 'C', 'JAVASCRIPT', 'TYPESCRIPT', 'GO', 'RUST', 'CSHARP', 'KOTLIN',
  ];

  let fixed = 0;
  for (const problem of broken) {
    const def = problemMap.get(problem.slug);
    if (!def) {
      console.warn(`  ⚠ No dataset entry found for slug: ${problem.slug}`);
      continue;
    }

    // Add visible test cases
    if (def.visibleTests && def.visibleTests.length > 0) {
      await prisma.testCase.createMany({
        data: def.visibleTests.map((tc, idx) => ({
          problemId: problem.id,
          input: tc.input,
          expectedOutput: tc.output,
          isSample: idx === 0,
          isHidden: false,
          weight: 1,
          displayOrder: idx,
        })),
        skipDuplicates: true,
      });
    }

    // Add hidden test cases
    if (def.hiddenTests && def.hiddenTests.length > 0) {
      await prisma.testCase.createMany({
        data: def.hiddenTests.map((tc, idx) => ({
          problemId: problem.id,
          input: tc.input,
          expectedOutput: tc.output,
          isSample: false,
          isHidden: true,
          weight: 2,
          displayOrder: (def.visibleTests?.length ?? 0) + idx,
        })),
        skipDuplicates: true,
      });
    }

    // Add templates for all languages
    for (const lang of languages) {
      const customCode = def.starterCode?.[lang.toLowerCase()] ?? def.starterCode?.[lang];
      const template = customCode ?? LANGUAGE_CONFIGS[lang]?.starterTemplate ?? '';
      await prisma.codeTemplate.upsert({
        where: { problemId_language: { problemId: problem.id, language: lang } },
        create: { problemId: problem.id, language: lang, template },
        update: customCode ? { template } : {},
      });
    }

    console.log(`  ✔ Fixed: ${problem.slug}`);
    fixed++;
  }

  console.log(`\n✅ Fixed ${fixed}/${broken.length} problems.`);

  const [tc, tmpl] = await Promise.all([
    prisma.testCase.count(),
    prisma.codeTemplate.count(),
  ]);
  console.log(`   Total test cases: ${tc} | Total templates: ${tmpl}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
