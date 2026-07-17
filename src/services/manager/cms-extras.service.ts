/**
 * FPRD-10: CMS Extras Service
 * Handles Banners, FAQ, Testimonials, Media Library, Version History, Global Search
 */

import { prisma } from '../../config/database';
import { auditLogRepository } from '../../repositories/admin/audit-log.repository';
import { Role } from '@prisma/client';

export class CMSExtrasService {
  // ── Banners ────────────────────────────────────────────────────────────────

  async getBanners(params: { placement?: string; isActive?: boolean; page?: number; limit?: number }) {
    const { placement, isActive, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (placement) where['placement'] = placement.toUpperCase();
    if (isActive !== undefined) where['isActive'] = isActive;
    const [data, total] = await Promise.all([
      prisma.banner.findMany({ where, skip: (page - 1) * limit, take: limit, include: { creator: { select: { id: true, fullName: true } } }, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] }),
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
        placement: (rest['placement'] as string | undefined) as import('@prisma/client').BannerPlacement | undefined,
        type: (rest['type'] as string | undefined) as import('@prisma/client').BannerType | undefined,
        ctaText: rest['ctaText'] as string | undefined,
        ctaLink: rest['ctaLink'] as string | undefined,
        priority: rest['priority'] as number | undefined,
        isActive: rest['isActive'] as boolean | undefined,
        scheduledAt: rest['scheduledAt'] ? new Date(rest['scheduledAt'] as string) : undefined,
        expiresAt: rest['expiresAt'] ? new Date(rest['expiresAt'] as string) : undefined,
        createdBy: managerId,
      },
    });
    await auditLogRepository.create({ performedBy: managerId, role: Role.MANAGER, action: 'BANNER_CREATED', entity: 'Banner', entityId: banner.id });
    return banner;
  }

  async updateBanner(id: string, data: Record<string, unknown>, managerId: string) {
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new Error('Banner not found');
    const updated = await prisma.banner.update({ where: { id }, data });
    await this._saveVersion('Banner', id, managerId, data);
    return updated;
  }

  async deleteBanner(id: string, managerId: string) {
    await prisma.banner.delete({ where: { id } });
    await auditLogRepository.create({ performedBy: managerId, role: Role.MANAGER, action: 'BANNER_DELETED', entity: 'Banner', entityId: id });
  }

  // ── FAQ ────────────────────────────────────────────────────────────────────

  async getFaqCategories() {
    return prisma.faqCategory.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } });
  }

  async getFaqs(params: { search?: string; categoryId?: string; isPublished?: boolean; page?: number; limit?: number }) {
    const { search, categoryId, isPublished, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (search) where['OR'] = [{ question: { contains: search, mode: 'insensitive' } }, { answer: { contains: search, mode: 'insensitive' } }];
    if (categoryId) where['categoryId'] = categoryId;
    if (isPublished !== undefined) where['isPublished'] = isPublished;
    const [data, total] = await Promise.all([
      prisma.faq.findMany({ where, skip: (page - 1) * limit, take: limit, include: { category: true }, orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] }),
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
    await auditLogRepository.create({ performedBy: managerId, role: Role.MANAGER, action: 'FAQ_CREATED', entity: 'Faq', entityId: faq.id });
    return faq;
  }

  async updateFaq(id: string, data: Record<string, unknown>, managerId: string) {
    const existing = await prisma.faq.findUnique({ where: { id } });
    if (!existing) throw new Error('FAQ not found');
    const updated = await prisma.faq.update({ where: { id }, data });
    await this._saveVersion('Faq', id, managerId, data);
    return updated;
  }

  async deleteFaq(id: string) {
    await prisma.faq.delete({ where: { id } });
  }

  // ── Testimonials ───────────────────────────────────────────────────────────

  async getTestimonials(params: { isFeatured?: boolean; isPublished?: boolean; page?: number; limit?: number }) {
    const { isFeatured, isPublished, page = 1, limit = 20 } = params;
    const where: Record<string, unknown> = {};
    if (isFeatured !== undefined) where['isFeatured'] = isFeatured;
    if (isPublished !== undefined) where['isPublished'] = isPublished;
    const [data, total] = await Promise.all([
      prisma.testimonial.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
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
    await auditLogRepository.create({ performedBy: managerId, role: Role.MANAGER, action: 'TESTIMONIAL_CREATED', entity: 'Testimonial', entityId: t.id });
    return t;
  }

  async updateTestimonial(id: string, data: Record<string, unknown>, managerId: string) {
    const existing = await prisma.testimonial.findUnique({ where: { id } });
    if (!existing) throw new Error('Testimonial not found');
    return prisma.testimonial.update({ where: { id }, data });
  }

  async deleteTestimonial(id: string) {
    await prisma.testimonial.delete({ where: { id } });
  }

  // ── Media Library ──────────────────────────────────────────────────────────

  async getMediaFiles(params: { search?: string; folder?: string; fileType?: string; page?: number; limit?: number }) {
    const { search, folder, fileType, page = 1, limit = 30 } = params;
    const where: Record<string, unknown> = {};
    if (search) where['OR'] = [{ filename: { contains: search, mode: 'insensitive' } }, { originalName: { contains: search, mode: 'insensitive' } }];
    if (folder) where['folder'] = folder;
    if (fileType) where['fileType'] = fileType.toUpperCase();
    const [data, total] = await Promise.all([
      prisma.mediaFile.findMany({ where, skip: (page - 1) * limit, take: limit, include: { uploader: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.mediaFile.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createMediaFile(data: Record<string, unknown>, managerId: string) {
    return prisma.mediaFile.create({
      data: {
        filename: data['filename'] as string,
        originalName: (data['originalName'] as string | undefined) ?? (data['filename'] as string),
        mimeType: (data['mimeType'] as string | undefined) ?? 'application/octet-stream',
        fileUrl: data['fileUrl'] as string,
        fileType: (data['fileType'] as string | undefined) as import('@prisma/client').MediaFileType | undefined,
        fileSize: data['fileSize'] as number | undefined,
        folder: data['folder'] as string | undefined,
        altText: data['altText'] as string | undefined,
        uploadedBy: managerId,
      },
    });
  }

  async updateMediaFile(id: string, data: Record<string, unknown>) {
    const existing = await prisma.mediaFile.findUnique({ where: { id } });
    if (!existing) throw new Error('Media file not found');
    return prisma.mediaFile.update({ where: { id }, data });
  }

  async deleteMediaFile(id: string) {
    await prisma.mediaFile.delete({ where: { id } });
  }

  async getMediaFolders() {
    const result = await prisma.mediaFile.findMany({ select: { folder: true }, distinct: ['folder'] });
    return result.map((r) => r.folder).filter(Boolean);
  }

  // ── Version History ────────────────────────────────────────────────────────

  async getVersionHistory(entity: string, entityId: string) {
    return prisma.contentVersion.findMany({
      where: { entity, entityId },
      include: { editor: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async _saveVersion(entity: string, entityId: string, editedBy: string, newValue: Record<string, unknown>) {
    const lastVersion = await prisma.contentVersion.findFirst({
      where: { entity, entityId },
      orderBy: { version: 'desc' },
    });
    await prisma.contentVersion.create({
      data: {
        entity,
        entityId,
        version: (lastVersion?.version ?? 0) + 1,
        editedBy,
        newValue: newValue as object,
      },
    });
  }

  async restoreVersion(versionId: string, managerId: string) {
    const version = await prisma.contentVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new Error('Version not found');
    await auditLogRepository.create({
      performedBy: managerId, role: Role.MANAGER, action: 'VERSION_RESTORED',
      entity: version.entity, entityId: version.entityId, newValue: { versionId } as object,
    });
    return version;
  }

  // ── Global Search ──────────────────────────────────────────────────────────

  async globalSearch(query: string, limit = 10) {
    if (!query || query.trim().length < 2) return { results: [], total: 0 };
    const q = query.trim();

    const [roadmaps, lessons, problems, projects, companies, events, resources] = await Promise.all([
      prisma.roadmap.findMany({ where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] }, take: limit, select: { id: true, title: true, description: true, isPublished: true } }),
      prisma.lesson.findMany({ where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] }, take: limit, select: { id: true, title: true, description: true, isPublished: true } }),
      prisma.codingProblem.findMany({ where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] }, take: limit, select: { id: true, title: true, difficulty: true, isPublished: true } }),
      prisma.project.findMany({ where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] }, take: limit, select: { id: true, title: true, description: true, isPublished: true } }),
      prisma.company.findMany({ where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { industry: { contains: q, mode: 'insensitive' } }] }, take: limit, select: { id: true, name: true, industry: true } }),
      prisma.event.findMany({ where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] }, take: limit, select: { id: true, title: true, type: true, isPublished: true } }),
      prisma.learningResource.findMany({ where: { OR: [{ title: { contains: q, mode: 'insensitive' } }] }, take: limit, select: { id: true, title: true, type: true, url: true } }),
    ]);

    const results = [
      ...roadmaps.map((r) => ({ kind: 'roadmap' as const, ...r })),
      ...lessons.map((l) => ({ kind: 'lesson' as const, ...l })),
      ...problems.map((p) => ({ kind: 'problem' as const, ...p })),
      ...projects.map((p) => ({ kind: 'project' as const, ...p })),
      ...companies.map((c) => ({ kind: 'company' as const, id: c.id, title: c.name, extra: c.industry })),
      ...events.map((e) => ({ kind: 'event' as const, ...e })),
      ...resources.map((r) => ({ kind: 'resource' as const, id: r.id, title: r.title, resourceType: r.type, url: r.url })),
    ];

    return { results, total: results.length, query: q };
  }
}

export const cmsExtrasService = new CMSExtrasService();
