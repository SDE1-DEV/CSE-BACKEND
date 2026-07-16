/**
 * PRD-07: Script to promote any existing user to SUPER_ADMIN or MANAGER role.
 *
 * Usage:
 *   npx ts-node prisma/promote-admin.ts <email> [SUPER_ADMIN|MANAGER|ADMIN]
 *
 * Examples:
 *   npx ts-node prisma/promote-admin.ts admin@example.com SUPER_ADMIN
 *   npx ts-node prisma/promote-admin.ts manager@example.com MANAGER
 *   npx ts-node prisma/promote-admin.ts user@example.com ADMIN
 */

import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const roleArg = (process.argv[3] ?? 'SUPER_ADMIN').toUpperCase()

  if (!email) {
    console.error('Usage: npx ts-node prisma/promote-admin.ts <email> [SUPER_ADMIN|MANAGER|ADMIN]')
    process.exit(1)
  }

  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'MENTOR', 'STUDENT']
  if (!validRoles.includes(roleArg)) {
    console.error(`❌ Invalid role: ${roleArg}. Valid roles: ${validRoles.join(', ')}`)
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.error(`❌ No user found with email: ${email}`)
    process.exit(1)
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: roleArg as Role, isVerified: true },
  })

  // If promoting to MANAGER, set up default permissions for all modules
  if (roleArg === 'MANAGER') {
    const modules = ['LEARNING', 'CODING', 'PROJECTS', 'PLACEMENTS', 'EVENTS', 'NOTIFICATIONS', 'REPORTS']
    for (const module of modules) {
      await prisma.managerPermission.upsert({
        where: { managerId_module: { managerId: updated.id, module: module as any } },
        update: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, canPublish: true },
        create: {
          managerId: updated.id,
          module: module as any,
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canPublish: true,
        },
      })
    }
    console.log(`  ✅ Default permissions granted for all modules`)
  }

  console.log(`✅ Success! ${updated.fullName} (${updated.email}) is now ${updated.role}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
