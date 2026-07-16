import { User } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { supabase, STORAGE_BUCKET } from '../config/supabase';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { IUpdateProfileDto, IUserProfile } from '../interfaces/user.interface';
import { calculateProfileCompletion } from '../utils/profileCompletion';
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
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getProfile(userId: string): Promise<IUserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: IUpdateProfileDto): Promise<IUserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, MESSAGES.USER_NOT_FOUND);
    }

    const updatedData = { ...data };
    const mergedUser = { ...user, ...updatedData };
    const completion = calculateProfileCompletion(mergedUser);

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

    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `${userId}-${Date.now()}${ext}`;
    const filePath = `avatars/${fileName}`;

    try {
      // Delete old image if exists
      if (user.profileImage) {
        const oldPath = user.profileImage.split('/').slice(-2).join('/');
        await supabase.storage.from(STORAGE_BUCKET).remove([oldPath]);
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
      const completion = calculateProfileCompletion(mergedUser);

      await userRepository.updateProfileImage(userId, publicUrl, completion);

      return { profileImage: publicUrl };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Profile image upload failed', { error });
      throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, MESSAGES.FILE_UPLOAD_FAILED);
    }
  }
}

export const userService = new UserService();
