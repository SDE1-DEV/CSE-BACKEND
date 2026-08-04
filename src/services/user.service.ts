import { User } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { prisma } from '../config/database';
import { supabase, STORAGE_BUCKET } from '../config/supabase';
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

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const fileName = `${userId}-${Date.now()}${ext}`;
    const filePath = `avatars/${fileName}`;

    try {
      // Delete old image if exists
      if (user.profileImage) {
        try {
          const oldPath = user.profileImage.split('/').slice(-2).join('/');
          await supabase.storage.from(STORAGE_BUCKET).remove([oldPath]);
        } catch {
          // Non-critical
        }
      }

      // Upload to Supabase Storage
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

      if (error) {
        logger.error('Supabase storage upload failed', { error });
        throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, MESSAGES.FILE_UPLOAD_FAILED);
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Update user's profileImage in DB
      const mergedUser = { ...user, profileImage: publicUrl };
      const completion = calculateProfileCompletion(mergedUser as any);

      await userRepository.updateProfileImage(userId, publicUrl, completion);

      return { profileImage: publicUrl };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Profile image upload failed', { error });
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
        const oldPath = user.profileImage.split('/').slice(-2).join('/');
        await supabase.storage.from(STORAGE_BUCKET).remove([oldPath]);
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
    const updated = await userRepository.updateProfile(userId, filtered);
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
    const [submissions, progress, teams] = await Promise.all([
      prisma.submission.findMany({ where: { userId } }),
      prisma.userProgress.findMany({ where: { userId, completed: true } }),
      prisma.teamMember.findMany({ where: { userId } }),
    ]);

    const accepted = submissions.filter((s) => s.status === 'ACCEPTED');

    return {
      totalSubmissions: submissions.length,
      accepted: accepted.length,
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
}

export const userService = new UserService();
