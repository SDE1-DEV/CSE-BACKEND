import { supabase } from '../config/supabase';
import { projectFileRepository } from '../repositories/project-file.repository';
import { projectRepository } from '../repositories/project.repository';
import { teamRepository } from '../repositories/team.repository';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS, PROJECT_MESSAGES } from '../constants';
import { projectEventEmitter } from '../events/project-events';

const PROJECT_FILES_BUCKET = 'project-files';

export class ProjectFileService {
  async uploadFile(
    projectId: string,
    userId: string,
    file: Express.Multer.File,
    title: string,
  ) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_NOT_FOUND);
    }

    const ext = file.originalname.split('.').pop() ?? 'bin';
    const fileName = `${projectId}/${userId}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(PROJECT_FILES_BUCKET)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, PROJECT_MESSAGES.FILE_UPLOAD_FAILED);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(PROJECT_FILES_BUCKET).getPublicUrl(fileName);

    const projectFile = await projectFileRepository.create({
      project: { connect: { id: projectId } },
      uploader: { connect: { id: userId } },
      title,
      fileUrl: publicUrl,
      fileType: file.mimetype,
    });

    // Find a team for this project to emit event
    const teams = await teamRepository.findAll({ projectId }, { page: 1, limit: 1 });
    if (teams.data.length > 0) {
      projectEventEmitter.emit('file:uploaded', {
        fileId: projectFile.id,
        projectId,
        teamId: teams.data[0].id,
        userId,
        fileName: title,
      });
    }

    return projectFile;
  }

  async getProjectFiles(projectId: string, page: number, limit: number) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.PROJECT_NOT_FOUND);
    }

    const normalizedPage = page ?? 1;
    const normalizedLimit = Math.min(limit ?? 20, 100);

    const { data, total } = await projectFileRepository.findByProjectId(projectId, {
      page: normalizedPage,
      limit: normalizedLimit,
    });

    return {
      data,
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      totalPages: Math.ceil(total / normalizedLimit),
    };
  }

  async deleteFile(id: string, userId: string): Promise<void> {
    const file = await projectFileRepository.findById(id);
    if (!file) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, PROJECT_MESSAGES.FILE_NOT_FOUND);
    }

    if (file.uploadedBy !== userId) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, 'You can only delete files you uploaded');
    }

    // Extract path from URL and delete from Supabase
    try {
      const url = new URL(file.fileUrl);
      const pathParts = url.pathname.split(`/${PROJECT_FILES_BUCKET}/`);
      if (pathParts.length > 1) {
        await supabase.storage.from(PROJECT_FILES_BUCKET).remove([pathParts[1]]);
      }
    } catch {
      // Ignore storage deletion errors — always delete the DB record
    }

    await projectFileRepository.delete(id);
  }
}

export const projectFileService = new ProjectFileService();
