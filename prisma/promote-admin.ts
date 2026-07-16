/**
 * Quick script to promote any existing user to ADMIN role.
 *
 * Usage:
 *   npx ts-node prisma/promote-admin.ts your-email@example.com
 */

import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error('Usage: npx ts-node prisma/promote-admin.ts <email>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.error(`❌ No user found with email: ${email}`)
    process.exit(1)
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: Role.ADMIN, isVerified: true },
  })

  console.log(`✅ Success! ${updated.fullName} (${updated.email}) is now ADMIN`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
