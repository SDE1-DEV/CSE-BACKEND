/**
 * FPRD-19 Part 7 — Related Problems Auto-Linker
 *
 * Links problems that share the same topic/category as related.
 * Also links problems that share multiple tags (overlap >= 2 tags).
 *
 * Usage: npx ts-node scripts/link-related-problems.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (process.env['DIRECT_URL']) process.env['DATABASE_URL'] = process.env['DIRECT_URL'];

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔗 FPRD-19 Part 7 — Linking related problems...\n');

  // Get all published problems with their tags and category
  const problems = await prisma.codingProblem.findMany({
    where: { isPublished: true, deletedAt: null },
    select: {
      id: true, slug: true, title: true, categoryId: true, difficulty: true,
      tags: { select: { tagId: true } },
    },
  });

  console.log(`Found ${problems.length} published problems`);

  // Build tag set for each problem
  const problemTagMap = new Map<string, Set<string>>();
  for (const p of problems) {
    problemTagMap.set(p.id, new Set(p.tags.map((t) => t.tagId)));
  }

  const links: Array<{ fromId: string; toId: string }> = [];
  const seen = new Set<string>();

  for (let i = 0; i < problems.length; i++) {
    const a = problems[i]!;
    const aSlug = a.slug;

    // Same category, different difficulty = related
    const sameCat = problems.filter(
      (b) => b.id !== a.id && b.categoryId === a.categoryId,
    ).slice(0, 4); // max 4 same-category links

    for (const b of sameCat) {
      const key = [a.id, b.id].sort().join(':');
      if (!seen.has(key)) {
        seen.add(key);
        links.push({ fromId: a.id, toId: b.id });
        links.push({ fromId: b.id, toId: a.id });
      }
    }

    // Tag overlap >= 2 tags = related
    const aTags = problemTagMap.get(a.id)!;
    if (aTags.size >= 2) {
      for (let j = i + 1; j < problems.length; j++) {
        const b = problems[j]!;
        if (b.categoryId === a.categoryId) continue; // already handled above
        const bTags = problemTagMap.get(b.id)!;
        let overlap = 0;
        for (const t of aTags) { if (bTags.has(t)) overlap++; }
        if (overlap >= 2) {
          const key = [a.id, b.id].sort().join(':');
          if (!seen.has(key)) {
            seen.add(key);
            links.push({ fromId: a.id, toId: b.id });
            links.push({ fromId: b.id, toId: a.id });
          }
        }
      }
    }
  }

  console.log(`Generated ${links.length} directional related links`);

  // Upsert in batches
  let inserted = 0;
  const BATCH = 100;
  for (let i = 0; i < links.length; i += BATCH) {
    const batch = links.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map((link) =>
        prisma.relatedProblem.upsert({
          where: { fromId_toId: { fromId: link.fromId, toId: link.toId } },
          create: link,
          update: {},
        }),
      ),
    );
    inserted += results.filter((r) => r.status === 'fulfilled').length;
  }

  console.log(`\n✅ Related problems linked: ${inserted} pairs`);

  const total = await prisma.relatedProblem.count();
  console.log(`📊 Total related problem links in DB: ${total}`);
}

main()
  .catch((err) => { console.error('✗ Error:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
