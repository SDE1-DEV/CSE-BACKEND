/**
 * FPRD-17 Phase 11 — Code Autosave (Draft) Service
 *
 * Automatically saves code every few seconds per user/problem/language.
 * Restores draft when reopening the editor.
 */

import { ProgrammingLanguage } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class CodeDraftService {
  /**
   * Save or update a code draft (upsert by userId + problemId + language).
   */
  async saveDraft(
    userId: string,
    problemId: string,
    language: ProgrammingLanguage,
    code: string,
  ): Promise<{ savedAt: Date }> {
    const draft = await prisma.codeDraft.upsert({
      where: { userId_problemId_language: { userId, problemId, language } },
      create: { userId, problemId, language, code },
      update: { code, updatedAt: new Date() },
    });

    return { savedAt: draft.updatedAt };
  }

  /**
   * Get the draft for a specific problem + language.
   * Returns null if no draft saved.
   */
  async getDraft(
    userId: string,
    problemId: string,
    language: ProgrammingLanguage,
  ): Promise<{ code: string; savedAt: Date } | null> {
    const draft = await prisma.codeDraft.findUnique({
      where: { userId_problemId_language: { userId, problemId, language } },
      select: { code: true, updatedAt: true },
    });

    if (!draft) return null;
    return { code: draft.code, savedAt: draft.updatedAt };
  }

  /**
   * Get all drafts for a user on a specific problem (all languages).
   */
  async getDraftsForProblem(
    userId: string,
    problemId: string,
  ): Promise<Array<{ language: ProgrammingLanguage; code: string; savedAt: Date }>> {
    const drafts = await prisma.codeDraft.findMany({
      where: { userId, problemId },
      select: { language: true, code: true, updatedAt: true },
    });

    return drafts.map((d) => ({ language: d.language, code: d.code, savedAt: d.updatedAt }));
  }

  /**
   * Delete a draft (e.g. after successful submission).
   */
  async deleteDraft(
    userId: string,
    problemId: string,
    language: ProgrammingLanguage,
  ): Promise<void> {
    await prisma.codeDraft.deleteMany({
      where: { userId, problemId, language },
    });
  }
}

export const codeDraftService = new CodeDraftService();
