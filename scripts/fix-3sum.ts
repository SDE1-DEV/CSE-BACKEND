import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (process.env['DIRECT_URL']) process.env['DATABASE_URL'] = process.env['DIRECT_URL'];

import { PrismaClient, ProgrammingLanguage } from '@prisma/client';
import { LANGUAGE_CONFIGS } from '../src/services/execution';

const prisma = new PrismaClient();

// The 3Sum test cases and templates to fix
const visibleTests = [
  { input: '6\n-1 0 1 2 -1 -4', output: '-1 -1 2\n-1 0 1' },
  { input: '3\n0 1 1', output: '' },
];
const hiddenTests = [
  { input: '3\n0 0 0', output: '0 0 0' },
  { input: '6\n-4 -1 -1 0 1 2', output: '-1 -1 2\n-1 0 1' },
  { input: '4\n1 2 -2 -1', output: '' },
  { input: '5\n-2 0 1 1 2', output: '-2 0 2\n-2 1 1' },
  { input: '6\n-1 -1 -1 2 2 2', output: '-1 -1 2' },
  { input: '3\n1 -1 0', output: '-1 0 1' },
  { input: '5\n0 0 0 0 0', output: '0 0 0' },
  { input: '4\n-4 -2 1 4', output: '' },
];

async function main() {
  // Try both slug variants
  const problem = await prisma.codingProblem.findFirst({
    where: { slug: { in: ['3-sum', '3sum', 'three-sum'] } },
    select: { id: true, slug: true },
  });

  if (!problem) {
    console.log('3Sum problem not found in DB. It may not have been imported. Skipping.');
    return;
  }

  console.log(`Found problem: ${problem.slug} (${problem.id})`);

  const existingTests = await prisma.testCase.count({ where: { problemId: problem.id } });
  if (existingTests > 0) {
    console.log(`Already has ${existingTests} test cases. Skipping.`);
    return;
  }

  await prisma.testCase.createMany({
    data: [
      ...visibleTests.map((tc, idx) => ({
        problemId: problem.id, input: tc.input, expectedOutput: tc.output,
        isSample: idx === 0, isHidden: false, weight: 1, displayOrder: idx,
      })),
      ...hiddenTests.map((tc, idx) => ({
        problemId: problem.id, input: tc.input, expectedOutput: tc.output,
        isSample: false, isHidden: true, weight: 2, displayOrder: visibleTests.length + idx,
      })),
    ],
  });

  const langs: ProgrammingLanguage[] = ['PYTHON', 'JAVA', 'CPP', 'C', 'JAVASCRIPT', 'TYPESCRIPT', 'GO', 'RUST', 'CSHARP', 'KOTLIN'];
  for (const lang of langs) {
    await prisma.codeTemplate.upsert({
      where: { problemId_language: { problemId: problem.id, language: lang } },
      create: { problemId: problem.id, language: lang, template: LANGUAGE_CONFIGS[lang]?.starterTemplate ?? '' },
      update: {},
    });
  }

  console.log(`✔ Fixed 3Sum: ${visibleTests.length + hiddenTests.length} test cases, ${langs.length} templates`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
