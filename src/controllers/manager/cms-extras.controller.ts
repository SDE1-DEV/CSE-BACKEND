/**
 * FPRD-10: CMS Extras Controller
 * Banners, FAQ, Testimonials, Media Library, Version History, Global Search
 */

import { Response, NextFunction } from 'express';
import { cmsExtrasService } from '../../services/manager/cms-extras.service';
import { sendSuccess, sendCreated } from '../../utils/response';
import { AuthenticatedRequest } from '../../types';

// ── Banners ────────────────────────────────────────────────────────────────────

export const getBanners = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { placement, isActive, page, limit } = req.query as Record<string, string>;
    const data = await cmsExtrasService.getBanners({ placement, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Banners fetched', data);
  } catch (e) { next(e); }
};

export const createBanner = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cmsExtrasService.createBanner(req.body, req.user!.userId);
    sendCreated(res, 'Banner created', data);
  } catch (e) { next(e); }
};

export const updateBanner = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cmsExtrasService.updateBanner(req.params['id'], req.body, req.user!.userId);
    sendSuccess(res, 'Banner updated', data);
  } catch (e) { next(e); }
};

export const deleteBanner = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await cmsExtrasService.deleteBanner(req.params['id'], req.user!.userId);
    sendSuccess(res, 'Banner deleted', null);
  } catch (e) { next(e); }
};

// ── FAQ ─────────────────────────────────────────────────────────────────────────

export const getFaqCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cmsExtrasService.getFaqCategories();
    sendSuccess(res, 'FAQ categories fetched', data);
  } catch (e) { next(e); }
};

export const getFaqs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, categoryId, isPublished, page, limit } = req.query as Record<string, string>;
    const data = await cmsExtrasService.getFaqs({ search, categoryId, isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'FAQs fetched', data);
  } catch (e) { next(e); }
};

export const createFaq = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cmsExtrasService.createFaq(req.body, req.user!.userId);
    sendCreated(res, 'FAQ created', data);
  } catch (e) { next(e); }
};

export const updateFaq = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cmsExtrasService.updateFaq(req.params['id'], req.body, req.user!.userId);
    sendSuccess(res, 'FAQ updated', data);
  } catch (e) { next(e); }
};

export const deleteFaq = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await cmsExtrasService.deleteFaq(req.params['id']);
    sendSuccess(res, 'FAQ deleted', null);
  } catch (e) { next(e); }
};

// ── Testimonials ───────────────────────────────────────────────────────────────

export const getTestimonials = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { isFeatured, isPublished, page, limit } = req.query as Record<string, string>;
    const data = await cmsExtrasService.getTestimonials({ isFeatured: isFeatured === 'true' ? true : undefined, isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Testimonials fetched', data);
  } catch (e) { next(e); }
};

export const createTestimonial = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cmsExtrasService.createTestimonial(req.body, req.user!.userId);
    sendCreated(res, 'Testimonial created', data);
  } catch (e) { next(e); }
};

export const updateTestimonial = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cmsExtrasService.updateTestimonial(req.params['id'], req.body, req.user!.userId);
    sendSuccess(res, 'Testimonial updated', data);
  } catch (e) { next(e); }
};

export const deleteTestimonial = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await cmsExtrasService.deleteTestimonial(req.params['id']);
    sendSuccess(res, 'Testimonial deleted', null);
  } catch (e) { next(e); }
};

// ── Media Library ──────────────────────────────────────────────────────────────

export const getMediaFiles = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, folder, fileType, page, limit } = req.query as Record<string, string>;
    const data = await cmsExtrasService.getMediaFiles({ search, folder, fileType, page: page ? +page : undefined, limit: limit ? +limit : undefined });
    sendSuccess(res, 'Media files fetched', data);
  } catch (e) { next(e); }
};

export const createMediaFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cmsExtrasService.createMediaFile(req.body, req.user!.userId);
    sendCreated(res, 'Media file registered', data);
  } catch (e) { next(e); }
};

export const updateMediaFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cmsExtrasService.updateMediaFile(req.params['id'], req.body);
    sendSuccess(res, 'Media file updated', data);
  } catch (e) { next(e); }
};

export const deleteMediaFile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await cmsExtrasService.deleteMediaFile(req.params['id']);
    sendSuccess(res, 'Media file deleted', null);
  } catch (e) { next(e); }
};

export const getMediaFolders = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cmsExtrasService.getMediaFolders();
    sendSuccess(res, 'Folders fetched', data);
  } catch (e) { next(e); }
};

// ── Version History ────────────────────────────────────────────────────────────

export const getVersionHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entity, entityId } = req.params;
    const data = await cmsExtrasService.getVersionHistory(entity, entityId);
    sendSuccess(res, 'Version history fetched', data);
  } catch (e) { next(e); }
};

export const restoreVersion = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await cmsExtrasService.restoreVersion(req.params['versionId'], req.user!.userId);
    sendSuccess(res, 'Version restored', data);
  } catch (e) { next(e); }
};

// ── Global Search ──────────────────────────────────────────────────────────────

export const globalCMSSearch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, limit } = req.query as Record<string, string>;
    const data = await cmsExtrasService.globalSearch(q ?? '', limit ? +limit : undefined);
    sendSuccess(res, 'Search results', data);
  } catch (e) { next(e); }
};
