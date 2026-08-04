import { User } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { prisma } from '../config/database';
import { supabase, STORAGE_BUCKET, RESUME_BUCKET } from '../config/supabase';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { IUpdateProfileDto, IUserProfile, IPublicProfile } from '../interfaces/user.interface';
import { calculateProfileCompletion, getCompletionDetails } from '../utils/profileCompletion';
import { logger } from '../utils/logger';
import path from 'path';

export class UserService {
  private sanitizeUser(user: User): IUserProfile {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profileImage: user.profileImage,
      bio: user.bio,
      role: user.role,
      isVerified: user.isVerified,
      profileCompletion: user.profileCompletion,
      collegeName: user.collegeName,
      university: user.university,
      branch: user.branch,
      currentYear: user.currentYear,
      semester: user.semester,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      portfolioUrl: user.portfolioUrl,
      // FPRD-23 fields — now properly typed after prisma generate
      username: user.username ?? null,
      headline: user.headline ?? null,
      twitterUrl: user.twitterUrl ?? null,
      youtubeUrl: user.youtubeUrl ?? null,
      leetcodeUrl: user.leetcodeUrl ?? null,
      codechefUrl: user.codechefUrl ?? null,
      hackerrankUrl: user.hackerrankUrl ?? null,
      codeforcesUrl: user.codeforcesUrl ?? null,
      gfgUrl: user.gfgUrl ?? null,
      mediumUrl: user.mediumUrl ?? null,
      resumeUrl: user.resumeUrl ?? null,
      resumeFileName: (user as any).resumeFileName ?? null,
      resumeUploadedAt: (user as any).resumeUploadedAt ?? null,
      profileVisibility: user.profileVisibility ?? 'PUBLIC',
      lastSeen: user.lastSeen ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getProfile(userId: string): Promise<IUserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    }
    // Update lastSeen
    try {
      await userRepository.updateProfile(userId, { lastSeen: new Date() });
    } catch {
      // Non-critical, don't fail
    }
    return this.sanitizeUser(user);
  }

  async getPublicProfile(username: string): Promise<IPublicProfile> {
    const user = await userRepository.findByUsernameOrId(username);

    if (!user) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    }

    const visibility = user.profileVisibility ?? 'PUBLIC';
    if (visibility === 'PRIVATE') {
      throw new AppError(HTTP_STATUS.FORBIDDEN, 'This profile is private');
    }

    return {
      username: user.username ?? null,
      fullName: user.fullName,
      headline: user.headline ?? null,
      bio: user.bio,
      profileImage: user.profileImage,
      isVerified: user.isVerified,
      branch: user.branch,
      collegeName: user.collegeName,
      currentYear: user.currentYear,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      portfolioUrl: user.portfolioUrl,
      twitterUrl: user.twitterUrl ?? null,
      youtubeUrl: user.youtubeUrl ?? null,
      leetcodeUrl: user.leetcodeUrl ?? null,
      codechefUrl: user.codechefUrl ?? null,
      hackerrankUrl: user.hackerrankUrl ?? null,
      codeforcesUrl: user.codeforcesUrl ?? null,
      gfgUrl: user.gfgUrl ?? null,
      mediumUrl: user.mediumUrl ?? null,
      profileVisibility: visibility,
      createdAt: user.createdAt,
    };
  }


  async updateProfile(userId: string, data: IUpdateProfileDto): Promise<IUserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    }

    // Check username uniqueness if changing
    if (data.username && data.username !== user.username) {
      const existing = await userRepository.findByUsername(data.username);
      if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, 'Username is already taken');
      }
    }

    // Validate profile visibility
    if (data.profileVisibility && !['PUBLIC', 'FRIENDS', 'PRIVATE'].includes(data.profileVisibility)) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid profile visibility setting');
    }

    const updatedData = { ...data };
    const mergedUser = { ...user, ...updatedData };
    const completion = calculateProfileCompletion(mergedUser as any);

    const updated = await userRepository.updateProfile(userId, {
      ...updatedData,
      profileCompletion: completion,
    });

    return this.sanitizeUser(updated);
  }

  async uploadProfileImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ profileImage: string }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    }

    // Validate file type explicitly
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.mimetype)) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid image type. Only JPEG, PNG and WebP are allowed.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Image must be under 5MB.');
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const fileName = `${userId}-${Date.now()}${ext}`;
    const filePath = `avatars/${fileName}`;

    logger.info('[Avatar] Starting upload', { userId, filePath, size: file.size, mime: file.mimetype });

    try {
      // Delete old image if exists — extract storage path from public URL
      if (user.profileImage) {
        try {
          // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
          const urlObj = new URL(user.profileImage);
          const marker = `/object/public/${STORAGE_BUCKET}/`;
          const markerIdx = urlObj.pathname.indexOf(marker);
          if (markerIdx !== -1) {
            const oldStoragePath = urlObj.pathname.slice(markerIdx + marker.length);
            const { error: removeErr } = await supabase.storage.from(STORAGE_BUCKET).remove([oldStoragePath]);
            if (removeErr) {
              logger.warn('[Avatar] Could not delete old avatar (non-critical)', { oldStoragePath, error: removeErr.message });
            } else {
              logger.info('[Avatar] Old avatar deleted', { oldStoragePath });
            }
          }
        } catch (e) {
          logger.warn('[Avatar] Old avatar deletion skipped', { error: (e as Error).message });
        }
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        logger.error('[Avatar] Supabase storage upload failed', { error: uploadError.message, code: (uploadError as any).statusCode });
        throw new AppError(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          `Storage upload failed: ${uploadError.message}`,
        );
      }

      logger.info('[Avatar] Uploaded to Supabase', { filePath });

      // Get public URL
      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      logger.info('[Avatar] Got public URL', { publicUrl });

      // Update user's profileImage in DB
      const mergedUser = { ...user, profileImage: publicUrl };
      const completion = calculateProfileCompletion(mergedUser as any);

      await userRepository.updateProfileImage(userId, publicUrl, completion);
      logger.info('[Avatar] DB updated', { userId });

      return { profileImage: publicUrl };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('[Avatar] Profile image upload failed unexpectedly', { error: (error as Error).message });
      throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, MESSAGES.FILE_UPLOAD_FAILED);
    }
  }

  async deleteProfileImage(userId: string): Promise<IUserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    }

    if (user.profileImage) {
      try {
        const urlObj = new URL(user.profileImage);
        const marker = `/object/public/${STORAGE_BUCKET}/`;
        const markerIdx = urlObj.pathname.indexOf(marker);
        if (markerIdx !== -1) {
          const oldStoragePath = urlObj.pathname.slice(markerIdx + marker.length);
          await supabase.storage.from(STORAGE_BUCKET).remove([oldStoragePath]);
        }
      } catch {
        // Non-critical
      }
    }

    const mergedUser = { ...user, profileImage: null };
    const completion = calculateProfileCompletion(mergedUser as any);
    const updated = await userRepository.updateProfileImage(userId, null, completion);
    return this.sanitizeUser(updated);
  }

  async getProfileCompletion(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    }
    const percentage = calculateProfileCompletion(user as any);
    const details = getCompletionDetails(user as any);
    return { percentage, details };
  }

  async updatePrivacy(userId: string, visibility: string): Promise<IUserProfile> {
    if (!['PUBLIC', 'FRIENDS', 'PRIVATE'].includes(visibility)) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid visibility. Must be PUBLIC, FRIENDS, or PRIVATE');
    }
    const updated = await userRepository.updateProfile(userId, { profileVisibility: visibility });
    return this.sanitizeUser(updated);
  }

  async updateSocialLinks(userId: string, links: Record<string, string>): Promise<IUserProfile> {
    const allowedKeys = [
      'githubUrl', 'linkedinUrl', 'portfolioUrl', 'twitterUrl', 'youtubeUrl',
      'leetcodeUrl', 'codechefUrl', 'hackerrankUrl', 'codeforcesUrl', 'gfgUrl', 'mediumUrl',
    ];
    const filtered: Record<string, string> = {};
    for (const key of allowedKeys) {
      if (links[key] !== undefined) filtered[key] = links[key];
    }
    const updated = await userRepository.updateProfile(userId, filtered as Partial<IUpdateProfileDto>);
    return this.sanitizeUser(updated);
  }

  async getProfileActivity(userId: string) {
    const activities: Array<{
      type: string;
      label: string;
      time: Date;
      icon: string;
    }> = [];

    try {
      const submissions = await prisma.submission.findMany({
        where: { userId, status: 'ACCEPTED' },
        orderBy: { submittedAt: 'desc' },
        take: 5,
        include: { problem: { select: { title: true } } },
      });
      for (const s of submissions) {
        activities.push({ type: 'solved', label: `Solved ${s.problem.title}`, time: s.submittedAt, icon: 'Code2' });
      }

      const progress = await prisma.userProgress.findMany({
        where: { userId, completed: true },
        orderBy: { completedAt: 'desc' },
        take: 5,
        include: { lesson: { select: { title: true } } },
      });
      for (const p of progress) {
        activities.push({ type: 'lesson', label: `Completed lesson: ${p.lesson.title}`, time: p.completedAt ?? p.updatedAt, icon: 'BookOpen' });
      }
    } catch {
      // Return empty if tables don't have data
    }

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return activities.slice(0, 10);
  }

  async getProfileAnalytics(userId: string) {
    const [submissions, distinctSolved, progress, teams] = await Promise.all([
      prisma.submission.findMany({ where: { userId, isRun: false } }),
      // Distinct problems solved (same logic as getCodingStats)
      prisma.submission.findMany({
        where: { userId, status: 'ACCEPTED', isRun: false },
        distinct: ['problemId'],
        select: { problemId: true },
      }),
      prisma.userProgress.findMany({ where: { userId, completed: true } }),
      prisma.teamMember.findMany({ where: { userId } }),
    ]);

    const totalSolved = distinctSolved.length;
    const accepted = submissions.filter((s) => s.status === 'ACCEPTED');

    return {
      totalSubmissions: submissions.length,
      // accepted = distinct problems solved (not raw accepted submission count)
      accepted: totalSolved,
      rejected: submissions.filter((s) => s.status === 'WRONG_ANSWER').length,
      acceptanceRate: submissions.length > 0 ? Math.round((accepted.length / submissions.length) * 100) : 0,
      lessonsCompleted: progress.length,
      teamsJoined: teams.length,
    };
  }

  async getProfileProjects(userId: string) {
    const teams = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            project: {
              select: {
                id: true, title: true, description: true, slug: true,
                difficulty: true, githubRepository: true, liveDemo: true,
                technologies: { include: { technology: { select: { name: true } } } },
              },
            },
          },
        },
      },
      take: 10,
    });
    return teams.map((tm) => ({
      id: tm.team.project.id,
      title: tm.team.project.title,
      description: tm.team.project.description,
      slug: tm.team.project.slug,
      difficulty: tm.team.project.difficulty,
      githubRepository: tm.team.project.githubRepository,
      liveDemo: tm.team.project.liveDemo,
      role: tm.role,
      technologies: tm.team.project.technologies.map((t) => t.technology.name),
    }));
  }

  async getProfileAchievements(userId: string) {
    const [submissions, progress] = await Promise.all([
      prisma.submission.findMany({ where: { userId, status: 'ACCEPTED' } }),
      prisma.userProgress.findMany({ where: { userId, completed: true } }),
    ]);

    const achievements = [];

    if (submissions.length >= 1) achievements.push({ id: 1, name: 'First Solve', icon: '🎯', earned: true, earnedAt: submissions[0]?.submittedAt });
    if (submissions.length >= 100) achievements.push({ id: 2, name: '100 Problems', icon: '💯', earned: true });
    if (progress.length >= 1) achievements.push({ id: 3, name: 'First Lesson', icon: '📚', earned: true });
    if (progress.length >= 10) achievements.push({ id: 4, name: '10 Lessons', icon: '🎓', earned: true });

    return achievements;
  }

  // ── Resume file upload ──────────────────────────────────────────────────────

  async uploadResume(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ resumeUrl: string; resumeFileName: string; resumeUploadedAt: Date }> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    const ALLOWED_RESUME_TYPES = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!ALLOWED_RESUME_TYPES.includes(file.mimetype)) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Invalid file type. Only PDF and DOCX are allowed.');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Resume must be under 10MB.');
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${Date.now()}_${safeOriginalName}`;

    logger.info('[Resume] Starting upload', { userId, storagePath, size: file.size, mime: file.mimetype });

    try {
      // Delete old resume from storage if exists
      if ((user as any).resumeUrl) {
        try {
          const urlObj = new URL((user as any).resumeUrl as string);
          const marker = `/object/public/${RESUME_BUCKET}/`;
          const markerIdx = urlObj.pathname.indexOf(marker);
          if (markerIdx !== -1) {
            const oldPath = urlObj.pathname.slice(markerIdx + marker.length);
            await supabase.storage.from(RESUME_BUCKET).remove([oldPath]);
            logger.info('[Resume] Old resume deleted', { oldPath });
          }
        } catch (e) {
          logger.warn('[Resume] Old resume deletion skipped', { error: (e as Error).message });
        }
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(RESUME_BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        logger.error('[Resume] Supabase upload failed', { error: uploadError.message });
        throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, `Resume upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage.from(RESUME_BUCKET).getPublicUrl(storagePath);
      const resumeUrl = urlData.publicUrl;
      const resumeUploadedAt = new Date();

      await userRepository.updateProfile(userId, {
        resumeUrl,
        resumeFileName: safeOriginalName,
        resumeUploadedAt,
      } as any);

      logger.info('[Resume] DB updated', { userId, resumeUrl });
      return { resumeUrl, resumeFileName: safeOriginalName, resumeUploadedAt };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('[Resume] Upload failed unexpectedly', { error: (error as Error).message });
      throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Resume upload failed.');
    }
  }

  async deleteResume(userId: string): Promise<IUserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);

    if ((user as any).resumeUrl) {
      try {
        const urlObj = new URL((user as any).resumeUrl as string);
        const marker = `/object/public/${RESUME_BUCKET}/`;
        const markerIdx = urlObj.pathname.indexOf(marker);
        if (markerIdx !== -1) {
          const storagePath = urlObj.pathname.slice(markerIdx + marker.length);
          await supabase.storage.from(RESUME_BUCKET).remove([storagePath]);
        }
      } catch (e) {
        logger.warn('[Resume] Storage delete skipped', { error: (e as Error).message });
      }
    }

    const updated = await userRepository.updateProfile(userId, {
      resumeUrl: null,
      resumeFileName: null,
      resumeUploadedAt: null,
    } as any);

    return this.sanitizeUser(updated);
  }

  async getResumeInfo(userId: string): Promise<{ resumeUrl: string | null; resumeFileName: string | null; resumeUploadedAt: Date | null }> {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    return {
      resumeUrl: (user as any).resumeUrl ?? null,
      resumeFileName: (user as any).resumeFileName ?? null,
      resumeUploadedAt: (user as any).resumeUploadedAt ?? null,
    };
  }
}

export const userService = new UserService();
