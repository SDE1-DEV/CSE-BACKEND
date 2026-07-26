/**
 * FPRD-10: CMS Extras Service
 * Handles Banners, FAQ, Testimonials, Media Library, Version History, Global Search
 */

import { prisma } from '../../config/database';
import { auditLogRepository } from '../../repositories/admin/audit-log.repository';
import { contentVersionRepository } from '../../repositories/admin/content-version.repository';
import { supabase, MEDIA_BUCKET } from '../../config/supabase';
import { logger } from '../../utils/logger';
import { Role, MediaFileType } from '@prisma/client';

export class CMSExtrasService {
  // ── Banners ────────────────────────────────────────────────────────────────

  async getBanners(params: {
    placement?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { placement, isActive, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (placement) where['placement'] = placement.toUpperCase();
    if (isActive !== undefined) where['isActive'] = isActive;
    const [data, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { creator: { select: { id: true, fullName: true } } },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.banner.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createBanner(data: Record<string, unknown>, managerId: string) {
    const { creator: _c, ...rest } = data as Record<string, unknown>;
    const banner = await prisma.banner.create({
      data: {
        title: rest['title'] as string,
        mediaUrl: rest['mediaUrl'] as string,
        placement: rest['placement'] as string | undefined as
          import('@prisma/client').BannerPlacement | undefined,
        type: rest['type'] as string | undefined as import('@prisma/client').BannerType | undefined,
        ctaText: rest['ctaText'] as string | undefined,
        ctaLink: rest['ctaLink'] as string | undefined,
        priority: rest['priority'] as number | undefined,
        isActive: rest['isActive'] as boolean | undefined,
        scheduledAt: rest['scheduledAt'] ? new Date(rest['scheduledAt'] as string) : undefined,
        expiresAt: rest['expiresAt'] ? new Date(rest['expiresAt'] as string) : undefined,
        createdBy: managerId,
      },
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'BANNER_CREATED',
      entity: 'Banner',
      entityId: banner.id,
    });
    return banner;
  }

  async updateBanner(id: string, data: Record<string, unknown>, managerId: string) {
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new Error('Banner not found');
    const updated = await prisma.banner.update({ where: { id }, data });
    await this._saveVersion('Banner', id, managerId, updated, existing);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'BANNER_UPDATED',
      entity: 'Banner',
      entityId: id,
    });
    return updated;
  }

  async deleteBanner(id: string, managerId: string) {
    await prisma.banner.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'BANNER_DELETED',
      entity: 'Banner',
      entityId: id,
    });
  }

  // ── FAQ ────────────────────────────────────────────────────────────────────

  async getFaqCategories() {
    return prisma.faqCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { faqs: true } } },
    });
  }

  async createFaqCategory(
    data: { name: string; slug: string; displayOrder?: number },
    managerId: string,
  ) {
    const existing = await prisma.faqCategory.findUnique({ where: { slug: data.slug } });
    if (existing) throw new Error(`FAQ category with slug "${data.slug}" already exists`);
    const cat = await prisma.faqCategory.create({ data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'FAQ_CATEGORY_CREATED',
      entity: 'FaqCategory',
      entityId: cat.id,
    });
    return cat;
  }

  async updateFaqCategory(
    id: string,
    data: Partial<{ name: string; slug: string; displayOrder: number; isActive: boolean }>,
    managerId: string,
  ) {
    const cat = await prisma.faqCategory.findUnique({ where: { id } });
    if (!cat) throw new Error('FAQ category not found');
    const updated = await prisma.faqCategory.update({ where: { id }, data });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'FAQ_CATEGORY_UPDATED',
      entity: 'FaqCategory',
      entityId: id,
    });
    return updated;
  }

  async deleteFaqCategory(id: string, managerId: string) {
    const cat = await prisma.faqCategory.findUnique({
      where: { id },
      include: { _count: { select: { faqs: { where: { deletedAt: null } } } } },
    });
    if (!cat) throw new Error('FAQ category not found');
    if ((cat as unknown as { _count: { faqs: number } })._count.faqs > 0) {
      throw new Error(
        `Cannot delete: ${(cat as unknown as { _count: { faqs: number } })._count.faqs} FAQ(s) are in this category.`,
      );
    }
    await prisma.faqCategory.delete({ where: { id } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'FAQ_CATEGORY_DELETED',
      entity: 'FaqCategory',
      entityId: id,
    });
  }

  async getFaqs(params: {
    search?: string;
    categoryId?: string;
    isPublished?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { search, categoryId, isPublished, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search)
      where['OR'] = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
      ];
    if (categoryId) where['categoryId'] = categoryId;
    if (isPublished !== undefined) where['isPublished'] = isPublished;
    const [data, total] = await Promise.all([
      prisma.faq.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.faq.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createFaq(data: Record<string, unknown>, managerId: string) {
    const faq = await prisma.faq.create({
      data: {
        question: data['question'] as string,
        answer: data['answer'] as string,
        categoryId: data['categoryId'] as string | undefined,
        searchKeywords: data['searchKeywords'] as string | undefined,
        isPublished: data['isPublished'] as boolean | undefined,
        displayOrder: data['displayOrder'] as number | undefined,
        createdBy: managerId,
      },
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'FAQ_CREATED',
      entity: 'Faq',
      entityId: faq.id,
    });
    return faq;
  }

  async updateFaq(id: string, data: Record<string, unknown>, managerId: string) {
    const existing = await prisma.faq.findUnique({ where: { id } });
    if (!existing) throw new Error('FAQ not found');
    const updated = await prisma.faq.update({ where: { id }, data });
    await this._saveVersion('Faq', id, managerId, updated, existing);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'FAQ_UPDATED',
      entity: 'Faq',
      entityId: id,
    });
    return updated;
  }

  async deleteFaq(id: string, managerId: string) {
    const existing = await prisma.faq.findUnique({ where: { id } });
    if (!existing) throw new Error('FAQ not found');
    await prisma.faq.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'FAQ_DELETED',
      entity: 'Faq',
      entityId: id,
      oldValue: this._snapshot(existing),
    });
  }

  // ── Testimonials ───────────────────────────────────────────────────────────

  async getTestimonials(params: {
    isFeatured?: boolean;
    isPublished?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { isFeatured, isPublished, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (isFeatured !== undefined) where['isFeatured'] = isFeatured;
    if (isPublished !== undefined) where['isPublished'] = isPublished;
    const [data, total] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.testimonial.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createTestimonial(data: Record<string, unknown>, managerId: string) {
    const t = await prisma.testimonial.create({
      data: {
        studentName: data['studentName'] as string,
        content: data['content'] as string,
        studentId: data['studentId'] as string | undefined,
        role: data['role'] as string | undefined,
        company: data['company'] as string | undefined,
        rating: data['rating'] as number | undefined,
        avatarUrl: data['avatarUrl'] as string | undefined,
        isFeatured: data['isFeatured'] as boolean | undefined,
        isPublished: data['isPublished'] as boolean | undefined,
        createdBy: managerId,
      },
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'TESTIMONIAL_CREATED',
      entity: 'Testimonial',
      entityId: t.id,
    });
    return t;
  }

  async updateTestimonial(id: string, data: Record<string, unknown>, managerId: string) {
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) throw new Error('Testimonial not found');
    const updated = await prisma.testimonial.update({ where: { id }, data });
    await this._saveVersion('Testimonial', id, managerId, updated, existing);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'TESTIMONIAL_UPDATED',
      entity: 'Testimonial',
      entityId: id,
      oldValue: this._snapshot(existing),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteTestimonial(id: string, managerId: string) {
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) throw new Error('Testimonial not found');
    await prisma.testimonial.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'TESTIMONIAL_DELETED',
      entity: 'Testimonial',
      entityId: id,
      oldValue: this._snapshot(existing),
    });
  }

  // ── Media Library ──────────────────────────────────────────────────────────

  async getMediaFiles(params: {
    search?: string;
    folder?: string;
    fileType?: string;
    page?: number;
    limit?: number;
  }) {
    const { search, folder, fileType, page = 1, limit = 30 } = params;
    const where: Record<string, unknown> = {};
    if (search)
      where['OR'] = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    if (folder) where['folder'] = folder;
    if (fileType) where['fileType'] = fileType.toUpperCase();
    const [data, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { uploader: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mediaFile.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createMediaFile(data: Record<string, unknown>, managerId: string) {
    const media = await prisma.mediaFile.create({
      data: {
        filename: data['filename'] as string,
        originalName: (data['originalName'] as string | undefined) ?? (data['filename'] as string),
        mimeType: (data['mimeType'] as string | undefined) ?? 'application/octet-stream',
        fileUrl: data['fileUrl'] as string,
        fileType: data['fileType'] as string | undefined as
          import('@prisma/client').MediaFileType | undefined,
        fileSize: data['fileSize'] as number | undefined,
        folder: data['folder'] as string | undefined,
        altText: data['altText'] as string | undefined,
        uploadedBy: managerId,
      },
    });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'MEDIA_CREATED',
      entity: 'MediaFile',
      entityId: media.id,
      newValue: this._snapshot(media),
    });
    return media;
  }

  /**
   * Upload an actual file to Supabase Storage and register it in the media library.
   * Streams the multipart buffer to the CMS media bucket, then stores the public URL.
   */
  async uploadMedia(
    file: Express.Multer.File,
    meta: { folder?: string; altText?: string },
    managerId: string,
  ) {
    await this._ensureMediaBucket();

    const ext = file.originalname.includes('.') ? file.originalname.split('.').pop() : undefined;
    const safeExt = ext ? `.${ext.toLowerCase()}` : '';
    const objectPath = `${meta.folder ? `${meta.folder}/` : ''}${managerId}-${Date.now()}${safeExt}`;

    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (error) {
      logger.error('Media upload failed', { error: error.message });
      throw new Error(`Upload failed: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);

    const media = await prisma.mediaFile.create({
      data: {
        filename: objectPath,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileUrl: publicUrl,
        fileType: this._mediaTypeFromMime(file.mimetype),
        fileSize: file.size,
        folder: meta.folder,
        altText: meta.altText,
        uploadedBy: managerId,
      },
    });

    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'MEDIA_UPLOADED',
      entity: 'MediaFile',
      entityId: media.id,
      newValue: {
        filename: media.filename,
        fileUrl: media.fileUrl,
        fileSize: media.fileSize,
      } as object,
    });

    return media;
  }

  /** Create the media bucket on first use; ignores "already exists". */
  private async _ensureMediaBucket(): Promise<void> {
    const { error } = await supabase.storage.createBucket(MEDIA_BUCKET, { public: true });
    if (error && !/exist/i.test(error.message)) {
      logger.warn('Could not ensure media bucket', { error: error.message });
    }
  }

  private _mediaTypeFromMime(mime: string): MediaFileType {
    if (mime.startsWith('image/')) return MediaFileType.IMAGE;
    if (mime.startsWith('video/')) return MediaFileType.VIDEO;
    if (mime === 'application/pdf') return MediaFileType.PDF;
    if (/zip/.test(mime)) return MediaFileType.ZIP;
    if (/word|document/.test(mime)) return MediaFileType.DOCX;
    if (/powerpoint|presentation/.test(mime)) return MediaFileType.PPT;
    return MediaFileType.OTHER;
  }

  async updateMediaFile(id: string, data: Record<string, unknown>, managerId: string) {
    const existing = await prisma.mediaFile.findUnique({ where: { id } });
    if (!existing) throw new Error('Media file not found');
    const updated = await prisma.mediaFile.update({ where: { id }, data });
    await this._saveVersion('MediaFile', id, managerId, updated, existing);
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'MEDIA_UPDATED',
      entity: 'MediaFile',
      entityId: id,
      oldValue: this._snapshot(existing),
      newValue: this._snapshot(updated),
    });
    return updated;
  }

  async deleteMediaFile(id: string, managerId: string) {
    const existing = await prisma.mediaFile.findUnique({ where: { id } });
    if (!existing) throw new Error('Media file not found');
    await prisma.mediaFile.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'MEDIA_DELETED',
      entity: 'MediaFile',
      entityId: id,
      oldValue: this._snapshot(existing),
    });
  }

  async getMediaFolders() {
    const result = await prisma.mediaFile.findMany({
      select: { folder: true },
      distinct: ['folder'],
    });
    return result.map((r) => r.folder).filter(Boolean);
  }

  // ── Version History ────────────────────────────────────────────────────────

  async getVersionHistory(entity: string, entityId: string) {
    return contentVersionRepository.list(entity, entityId);
  }

  private async _saveVersion(
    entity: string,
    entityId: string,
    editedBy: string,
    newValue: unknown,
    oldValue?: unknown,
  ) {
    await contentVersionRepository.save({
      entity,
      entityId,
      editedBy,
      oldValue: this._snapshot(oldValue) ?? null,
      newValue: this._snapshot(newValue) ?? null,
    });
  }

  /**
   * Models whose versions can be restored, keyed by the `entity` string stored
   * on the ContentVersion / AuditLog rows.
   */
  private _restorableModels(): Record<
    string,
    { update: (args: unknown) => Promise<unknown>; findUnique: (args: unknown) => Promise<unknown> }
  > {
    return {
      Banner: prisma.banner,
      Faq: prisma.faq,
      FaqCategory: prisma.faqCategory,
      Testimonial: prisma.testimonial,
      Category: prisma.category,
      Roadmap: prisma.roadmap,
      RoadmapSection: prisma.roadmapSection,
      Lesson: prisma.lesson,
      LearningResource: prisma.learningResource,
      CodingProblem: prisma.codingProblem,
      Project: prisma.project,
      ProjectCategory: prisma.projectCategory,
      ProblemCategory: prisma.problemCategory,
      Company: prisma.company,
      JobPosting: prisma.jobPosting,
      Event: prisma.event,
      MediaFile: prisma.mediaFile,
    } as unknown as Record<
      string,
      {
        update: (args: unknown) => Promise<unknown>;
        findUnique: (args: unknown) => Promise<unknown>;
      }
    >;
  }

  /** Strip non-writable/system fields so a snapshot can be applied via `update`. */
  private _restorableData(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object') return {};
    const system = new Set(['id', 'createdAt', 'updatedAt', 'version', 'editedBy']);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (system.has(k) || k.startsWith('_') || v === undefined) continue;
      out[k] = v;
    }
    return out;
  }

  private _snapshot(value: unknown): object | undefined {
    if (value === null || value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value)) as object;
  }

  /**
   * Restore an entity to a stored version by re-applying that version's snapshot
   * to the live record, then recording the restore as a new version + audit log.
   */
  async restoreVersion(versionId: string, managerId: string) {
    const version = await contentVersionRepository.findById(versionId);
    if (!version) throw new Error('Version not found');

    const model = this._restorableModels()[version.entity];
    if (!model) throw new Error(`Restore is not supported for "${version.entity}"`);

    const snapshot = (version.newValue ?? version.oldValue) as unknown;
    const data = this._restorableData(snapshot);
    if (Object.keys(data).length === 0) throw new Error('This version has no restorable data');

    const current = await model.findUnique({ where: { id: version.entityId } });
    if (!current) throw new Error('The original record no longer exists and cannot be restored');

    const restored = await model.update({ where: { id: version.entityId }, data });

    await contentVersionRepository.save({
      entity: version.entity,
      entityId: version.entityId,
      editedBy: managerId,
      oldValue: this._snapshot(current) ?? null,
      newValue: this._snapshot(restored) ?? null,
      changeNote: `Restored from version ${version.version}`,
    });

    await auditLogRepository.create({
      performedBy: managerId,
      role: Role.MANAGER,
      action: 'VERSION_RESTORED',
      entity: version.entity,
      entityId: version.entityId,
      oldValue: this._snapshot(current) ?? null,
      newValue: { restoredFromVersion: version.version } as object,
    });

    return restored;
  }

  // ── Media Storage Usage ──────────────────────────────────────────────────

  async getStorageUsage() {
    const stats = await prisma.mediaFile.aggregate({
      _sum: { fileSize: true },
      _count: { _all: true },
    });
    const byType = await prisma.mediaFile.groupBy({
      by: ['fileType'],
      _sum: { fileSize: true },
      _count: { _all: true },
      where: { deletedAt: null },
    });
    return {
      totalBytes: stats._sum.fileSize ?? 0,
      totalFiles: stats._count._all,
      byType: byType.map((g) => ({
        type: g.fileType,
        bytes: g._sum.fileSize ?? 0,
        count: g._count._all,
      })),
    };
  }

  // ── Global Search ──────────────────────────────────────────────────────────

  async globalSearch(query: string, limit = 10) {
    if (!query || query.trim().length < 2) return { results: [], total: 0 };
    const q = query.trim();
    const softDel = { deletedAt: null } as const;

    const [
      roadmaps,
      lessons,
      problems,
      projects,
      companies,
      events,
      resources,
      faqs,
      testimonials,
      media,
    ] = await Promise.all([
      prisma.roadmap.findMany({
        where: {
          ...softDel,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { id: true, title: true, description: true, isPublished: true },
      }),
      prisma.lesson.findMany({
        where: {
          ...softDel,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { id: true, title: true, description: true, isPublished: true },
      }),
      prisma.codingProblem.findMany({
        where: {
          ...softDel,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { id: true, title: true, difficulty: true, isPublished: true },
      }),
      prisma.project.findMany({
        where: {
          ...softDel,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { id: true, title: true, description: true, isPublished: true },
      }),
      prisma.company.findMany({
        where: {
          ...softDel,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { industry: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { id: true, name: true, industry: true },
      }),
      prisma.event.findMany({
        where: {
          ...softDel,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { id: true, title: true, type: true, isPublished: true },
      }),
      prisma.learningResource.findMany({
        where: { ...softDel, OR: [{ title: { contains: q, mode: 'insensitive' } }] },
        take: limit,
        select: { id: true, title: true, type: true, url: true },
      }),
      prisma.faq.findMany({
        where: {
          ...softDel,
          OR: [
            { question: { contains: q, mode: 'insensitive' } },
            { answer: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { id: true, question: true, answer: true, isPublished: true },
      }),
      prisma.testimonial.findMany({
        where: {
          ...softDel,
          OR: [
            { studentName: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: {
          id: true,
          studentName: true,
          company: true,
          content: true,
          isPublished: true,
          rating: true,
        },
      }),
      prisma.mediaFile.findMany({
        where: {
          ...softDel,
          OR: [
            { filename: { contains: q, mode: 'insensitive' } },
            { originalName: { contains: q, mode: 'insensitive' } },
            { altText: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { id: true, originalName: true, fileType: true, fileUrl: true, fileSize: true },
      }),
    ]);

    const results = [
      ...roadmaps.map((r) => ({ kind: 'roadmap' as const, ...r })),
      ...lessons.map((l) => ({ kind: 'lesson' as const, ...l })),
      ...problems.map((p) => ({ kind: 'problem' as const, ...p })),
      ...projects.map((p) => ({ kind: 'project' as const, ...p })),
      ...companies.map((c) => ({
        kind: 'company' as const,
        id: c.id,
        title: c.name,
        extra: c.industry,
      })),
      ...events.map((e) => ({ kind: 'event' as const, ...e })),
      ...resources.map((r) => ({
        kind: 'resource' as const,
        id: r.id,
        title: r.title,
        resourceType: r.type,
        url: r.url,
      })),
      ...faqs.map((f) => ({
        kind: 'faq' as const,
        id: f.id,
        title: f.question,
        answer: f.answer,
        isPublished: f.isPublished,
      })),
      ...testimonials.map((t) => ({
        kind: 'testimonial' as const,
        id: t.id,
        title: t.studentName,
        company: t.company,
        content: t.content,
        rating: t.rating,
        isPublished: t.isPublished,
      })),
      ...media.map((m) => ({
        kind: 'media' as const,
        id: m.id,
        title: m.originalName,
        fileType: m.fileType,
        fileUrl: m.fileUrl,
        fileSize: m.fileSize,
      })),
    ];

    return { results, total: results.length, query: q };
  }
}

export const cmsExtrasService = new CMSExtrasService();
