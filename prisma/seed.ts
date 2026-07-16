/**
 * Prisma Seed Script
 * Creates default admin and student accounts for development.
 *
 * Usage:
 *   npx ts-node prisma/seed.ts
 *   OR add to package.json: "prisma": { "seed": "ts-node prisma/seed.ts" }
 *   then run: npx prisma db seed
 */

import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Admin Account ──────────────────────────────────────────────────────────
  const adminEmail = 'admin@cse.dev'
  const adminPassword = 'Admin@123'

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    const admin = await prisma.user.create({
      data: {
        fullName: 'Platform Admin',
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        isVerified: true,
        collegeName: 'CSE Platform',
      },
    })
    console.log(`✅ Admin created: ${admin.email} / ${adminPassword}`)
  } else {
    // Ensure existing user is promoted to admin
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: Role.ADMIN, isVerified: true },
    })
    console.log(`ℹ️  Admin already exists: ${adminEmail} — role confirmed as ADMIN`)
  }

  // ── Student Account ────────────────────────────────────────────────────────
  const studentEmail = 'student@cse.dev'
  const studentPassword = 'Student@123'

  const existingStudent = await prisma.user.findUnique({ where: { email: studentEmail } })

  if (!existingStudent) {
    const passwordHash = await bcrypt.hash(studentPassword, 12)
    const student = await prisma.user.create({
      data: {
        fullName: 'Test Student',
        email: studentEmail,
        passwordHash,
        role: Role.STUDENT,
        isVerified: true,
        collegeName: 'CSE College',
        branch: 'Computer Science',
        currentYear: 3,
      },
    })
    console.log(`✅ Student created: ${student.email} / ${studentPassword}`)
  } else {
    console.log(`ℹ️  Student already exists: ${studentEmail}`)
  }

  console.log('\n🎉 Seed complete!')
  console.log('─────────────────────────────────')
  console.log(`Admin  → ${adminEmail}  / ${adminPassword}`)
  console.log(`Student→ ${studentEmail} / ${studentPassword}`)
  console.log('─────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
