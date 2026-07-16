import { Prisma, User } from '@prisma/client';
import { prisma } from '../config/database';
import { IUpdateProfileDto } from '../interfaces/user.interface';

export class UserRepository {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async updateProfile(id: string, data: IUpdateProfileDto & { profileCompletion?: number }): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async setVerified(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isVerified: true },
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async updateProfileImage(id: string, imageUrl: string, completion: number): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { profileImage: imageUrl, profileCompletion: completion },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  }
}

export const userRepository = new UserRepository();
