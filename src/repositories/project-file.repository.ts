import { ProjectFile, Prisma } from '@prisma/client';
import { prisma } from '../config/database';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class ProjectFileRepository {
  async create(data: Prisma.ProjectFileCreateInput): Promise<ProjectFile> {
    return prisma.projectFile.create({
      data,
      include: {
        uploader: { select: { id: true, fullName: true, email: true, profileImage: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.projectFile.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, fullName: true, email: true, profileImage: true } },
      },
    });
  }

  async findByProjectId(
    projectId: string,
    pagination: PaginationOptions,
  ): Promise<{ data: ProjectFile[]; total: number }> {
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      prisma.projectFile.findMany({
        where: { projectId },
        include: {
          uploader: { select: { id: true, fullName: true, email: true, profileImage: true } },
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: pagination.limit,
      }),
      prisma.projectFile.count({ where: { projectId } }),
    ]);

    return { data: data as unknown as ProjectFile[], total };
  }

  async delete(id: string): Promise<void> {
    await prisma.projectFile.delete({ where: { id } });
  }
}

export const projectFileRepository = new ProjectFileRepository();
