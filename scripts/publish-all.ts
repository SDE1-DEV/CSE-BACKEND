import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (process.env['DIRECT_URL']) process.env['DATABASE_URL'] = process.env['DIRECT_URL'];

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.codingProblem.updateMany({
    where: { isPublished: false, deletedAt: null },
    data: { isPublished: true },
  });
  console.log(`Published ${updated.count} previously unpublished problems.`);

  const [total, published, testCases] = await Promise.all([
    prisma.codingProblem.count({ where: { deletedAt: null } }),
    prisma.codingProblem.count({ where: { isPublished: true, deletedAt: null } }),
    prisma.testCase.count(),
  ]);
  console.log(`Total problems: ${total} | Published: ${published} | Test cases: ${testCases}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
