import { PermissionModule } from '@prisma/client';
import { prisma } from '../../config/database';

export class ManagerPermissionRepository {
  async findByManager(managerId: string) {
    return prisma.managerPermission.findMany({
      where: { managerId },
      orderBy: { module: 'asc' },
    });
  }

  async upsertPermissions(
    managerId: string,
    permissions: Partial<Record<string, boolean>>,
  ) {
    const modules = Object.values(PermissionModule);

    const ops = modules.map((module) => {
      const moduleLower = module.toLowerCase();
      const enabled = permissions[moduleLower] === true;

      return prisma.managerPermission.upsert({
        where: { managerId_module: { managerId, module } },
        update: {
          canCreate: enabled,
          canRead: enabled,
          canUpdate: enabled,
          canDelete: enabled,
          canPublish: enabled,
        },
        create: {
          managerId,
          module,
          canCreate: enabled,
          canRead: enabled,
          canUpdate: enabled,
          canDelete: enabled,
          canPublish: enabled,
        },
      });
    });

    return prisma.$transaction(ops);
  }

  /** Returns the list of module names the manager has read access to */
  async getModuleNames(managerId: string): Promise<string[]> {
    const perms = await prisma.managerPermission.findMany({
      where: { managerId, canRead: true },
      select: { module: true },
    });
    return perms.map((p) => p.module as string);
  }

  async deleteByManager(managerId: string) {
    return prisma.managerPermission.deleteMany({ where: { managerId } });
  }
}

export const managerPermissionRepository = new ManagerPermissionRepository();
