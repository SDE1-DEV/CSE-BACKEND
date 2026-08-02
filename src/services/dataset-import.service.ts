/**
 * FPRD-17 Phase 18 — Dataset Import Pipeline
 *
 * Validates and ingests large collections of appropriately licensed problems.
 * NEVER imports copyrighted LeetCode content.
 *
 * Pipeline responsibilities:
 *  - schema validation        - duplicate detection
 *  - slug generation          - topic mapping
 *  - tag normalization        - company normalization
 *  - language template gen    - visible/hidden test validation
 *  - import reports           - rollback on failure
 */

import { ProgrammingLanguage, SourceType } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { LANGUAGE_CONFIGS } from './execution';

// Schema for each problem in the import dataset
export interface ImportProblemSchema {
  title: string;
  slug?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic: string;                // maps to ProblemCategory.slug
  statement: string;            // problem statement
  inputFormat?: string;
  outputFormat?: string;
  constraints?: string;
  notes?: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  hints?: string[];
  tags?: string[];
  companies?: string[];
  starterCode?: Partial<Record<string, string>>; // language → code
  visibleTests: Array<{ input: string; output: string }>;
  hiddenTests: Array<{ input: string; output: string }>;
  timeLimit?: number;   // ms, default 2000
  memoryLimit?: number; // MB, default 256
  xp?: number;
  estimatedTime?: number;
  license?: string;
  sourceType?: SourceType;
}

export interface ImportReport {
  total: number;
  imported: number;
  failed: number;
  skipped: number;
  errors: Array<{ index: number; title: string; reason: string }>;
  slugsCreated: string[];
}

export class DatasetImportService {
  /**
   * Main import pipeline entry point.
   * Processes an array of problems, returns a detailed report.
   */
  async importProblems(
    problems: ImportProblemSchema[],
    userId: string,
    sourceType: SourceType = 'ORIGINAL',
    filename = 'manual-import',
  ): Promise<ImportReport> {
    // Create a DatasetImport record
    const importRecord = await prisma.datasetImport.create({
      data: {
        filename,
        sourceType,
        status: 'PROCESSING',
        totalProblems: problems.length,
        importedBy: userId,
        startedAt: new Date(),
      },
    });

    const report: ImportReport = {
      total: problems.length,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      slugsCreated: [],
    };

    // Process each problem — wrap each in its own try/catch for rollback-per-item
    for (let i = 0; i < problems.length; i++) {
      const problem = problems[i]!;
      try {
        await this.processProblem(problem, userId, sourceType, report, i);
      } catch (err) {
        const reason = (err as Error).message;
        logger.warn('[DatasetImport] Problem failed', { index: i, title: problem.title, reason });
        report.failed++;
        report.errors.push({ index: i, title: problem.title, reason });
      }
    }

    // Update import record with final report
    await prisma.datasetImport.update({
      where: { id: importRecord.id },
      data: {
        status: report.failed === report.total ? 'FAILED' : 'COMPLETED',
        importedCount: report.imported,
        failedCount: report.failed,
        skippedCount: report.skipped,
        importReport: report as any,
        completedAt: new Date(),
      },
    });

    logger.info('[DatasetImport] Completed', {
      total: report.total,
      imported: report.imported,
      failed: report.failed,
      skipped: report.skipped,
    });

    return report;
  }

  private async processProblem(
    raw: ImportProblemSchema,
    userId: string,
    sourceType: SourceType,
    report: ImportReport,
    index: number,
  ): Promise<void> {
    // 1. Schema validation
    this.validateProblemSchema(raw, index);

    // 2. Slug generation
    const slug = raw.slug ?? this.generateSlug(raw.title);

    // 3. Duplicate detection
    const existing = await prisma.codingProblem.findUnique({ where: { slug } });
    if (existing) {
      report.skipped++;
      report.errors.push({ index, title: raw.title, reason: `Duplicate slug: ${slug}` });
      return;
    }

    // 4. Topic mapping — find or create ProblemCategory
    const category = await this.resolveCategory(raw.topic);

    // 5. Create the problem
    const problem = await prisma.codingProblem.create({
      data: {
        categoryId: category.id,
        title: raw.title,
        slug,
        description: raw.statement.slice(0, 500),
        problemStatement: raw.statement,
        inputFormat: raw.inputFormat ?? null,
        outputFormat: raw.outputFormat ?? null,
        constraints: raw.constraints ?? null,
        notes: raw.notes ?? null,
        sampleInput: raw.examples[0]?.input ?? null,
        sampleOutput: raw.examples[0]?.output ?? null,
        explanation: raw.examples[0]?.explanation ?? null,
        difficulty: raw.difficulty,
        timeLimit: raw.timeLimit ?? 2000,
        memoryLimit: raw.memoryLimit ?? 256,
        hints: raw.hints ? (raw.hints as any) : undefined,
        xp: raw.xp ?? (raw.difficulty === 'HARD' ? 30 : raw.difficulty === 'MEDIUM' ? 20 : 10),
        estimatedTime: raw.estimatedTime ?? (raw.difficulty === 'HARD' ? 60 : raw.difficulty === 'MEDIUM' ? 30 : 15),
        license: raw.license ?? 'ORIGINAL',
        sourceType: raw.sourceType ?? sourceType,
        isPublished: false, // must be reviewed/published by manager
      },
    });

    // 6. Tag normalization + linking
    if (raw.tags && raw.tags.length > 0) {
      for (const tagName of raw.tags) {
        await this.linkTag(problem.id, tagName);
      }
    }

    // 7. Company normalization + linking
    if (raw.companies && raw.companies.length > 0) {
      for (const companyName of raw.companies) {
        await this.linkCompany(problem.id, companyName);
      }
    }

    // 8. Visible test cases
    if (raw.visibleTests.length > 0) {
      await prisma.testCase.createMany({
        data: raw.visibleTests.map((tc, idx) => ({
          problemId: problem.id,
          input: tc.input,
          expectedOutput: tc.output,
          isSample: idx === 0,
          isHidden: false,
          weight: 1,
          displayOrder: idx,
        })),
      });
    }

    // 9. Hidden test cases
    if (raw.hiddenTests.length > 0) {
      await prisma.testCase.createMany({
        data: raw.hiddenTests.map((tc, idx) => ({
          problemId: problem.id,
          input: tc.input,
          expectedOutput: tc.output,
          isSample: false,
          isHidden: true,
          weight: 2,
          displayOrder: raw.visibleTests.length + idx,
        })),
      });
    }

    // 10. Language template generation
    await this.generateLanguageTemplates(problem.id, raw.starterCode);

    report.imported++;
    report.slugsCreated.push(slug);
  }

  private validateProblemSchema(raw: ImportProblemSchema, index: number): void {
    if (!raw.title || raw.title.trim().length === 0) {
      throw new Error(`Problem at index ${index} missing title`);
    }
    if (!raw.statement || raw.statement.trim().length === 0) {
      throw new Error(`Problem "${raw.title}" missing statement`);
    }
    if (!['EASY', 'MEDIUM', 'HARD'].includes(raw.difficulty)) {
      throw new Error(`Problem "${raw.title}" has invalid difficulty: ${raw.difficulty}`);
    }
    if (!raw.topic || raw.topic.trim().length === 0) {
      throw new Error(`Problem "${raw.title}" missing topic`);
    }
    if (!raw.visibleTests || raw.visibleTests.length === 0) {
      throw new Error(`Problem "${raw.title}" must have at least one visible test case`);
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
  }

  private async resolveCategory(topicSlug: string): Promise<{ id: string }> {
    const slug = topicSlug.toLowerCase().replace(/\s+/g, '-');
    const existing = await prisma.problemCategory.findFirst({
      where: {
        OR: [
          { slug },
          { name: { equals: topicSlug, mode: 'insensitive' } },
        ],
      },
    });

    if (existing) return { id: existing.id };

    // Create the category
    const created = await prisma.problemCategory.create({
      data: {
        name: topicSlug,
        slug,
        isActive: true,
      },
    });
    return { id: created.id };
  }

  private async linkTag(problemId: string, tagName: string): Promise<void> {
    const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Find existing tag by slug first, then by name — handle unique constraint safely
    let tag = await prisma.problemTag.findFirst({
      where: { OR: [{ slug }, { name: tagName }] },
      select: { id: true },
    });

    if (!tag) {
      try {
        tag = await prisma.problemTag.create({
          data: { name: tagName, slug },
          select: { id: true },
        });
      } catch {
        // Race condition: another concurrent import created the same tag
        tag = await prisma.problemTag.findFirst({
          where: { OR: [{ slug }, { name: tagName }] },
          select: { id: true },
        });
        if (!tag) throw new Error(`Failed to resolve tag: ${tagName}`);
      }
    }

    await prisma.problemTagRelation.upsert({
      where: { problemId_tagId: { problemId, tagId: tag.id } },
      create: { problemId, tagId: tag.id },
      update: {},
    });
  }

  private async linkCompany(problemId: string, companyName: string): Promise<void> {
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    let company = await prisma.company.findFirst({
      where: { OR: [{ slug }, { name: companyName }] },
      select: { id: true },
    });

    if (!company) {
      try {
        company = await prisma.company.create({
          data: { name: companyName, slug },
          select: { id: true },
        });
      } catch {
        company = await prisma.company.findFirst({
          where: { OR: [{ slug }, { name: companyName }] },
          select: { id: true },
        });
        if (!company) throw new Error(`Failed to resolve company: ${companyName}`);
      }
    }

    await prisma.problemCompany.upsert({
      where: { problemId_companyId: { problemId, companyId: company.id } },
      create: { problemId, companyId: company.id },
      update: {},
    });
  }

  private async generateLanguageTemplates(
    problemId: string,
    starterCode?: Partial<Record<string, string>>,
  ): Promise<void> {
    const languages: ProgrammingLanguage[] = ['PYTHON', 'JAVA', 'CPP', 'C', 'JAVASCRIPT', 'TYPESCRIPT', 'GO', 'RUST', 'CSHARP', 'KOTLIN'];

    for (const lang of languages) {
      const customCode = starterCode?.[lang.toLowerCase()] ?? starterCode?.[lang];
      const template = customCode ?? LANGUAGE_CONFIGS[lang]?.starterTemplate ?? '';

      await prisma.codeTemplate.upsert({
        where: { problemId_language: { problemId, language: lang } },
        create: { problemId, language: lang, template },
        update: customCode ? { template } : {},
      });
    }
  }

  /**
   * Get all import records (for admin dashboard).
   */
  async getImports(userId?: string, page = 1, limit = 20): Promise<any> {
    const where = userId ? { importedBy: userId } : {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.datasetImport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          importer: { select: { id: true, fullName: true, email: true } },
        },
      }),
      prisma.datasetImport.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get single import detail with report.
   */
  async getImportById(id: string): Promise<any> {
    return prisma.datasetImport.findUnique({
      where: { id },
      include: {
        importer: { select: { id: true, fullName: true, email: true } },
      },
    });
  }
}

export const datasetImportService = new DatasetImportService();
