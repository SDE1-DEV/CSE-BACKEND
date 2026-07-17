/**
 * PRD-08.1: Super Admin Bootstrap
 *
 * Runs once during server startup.
 * Creates the default SUPER_ADMIN account if one does not already exist.
 * Never creates duplicates — safe to run on every restart.
 */

import { Role } from '@prisma/client';
import { prisma } from '../config/database';
import { hashPassword } from '../utils/hash';

const SUPER_ADMIN_EMAIL = 'bathulasaikiran2k2@gmail.com';
const SUPER_ADMIN_PASSWORD = 'bathulasaikiran2k2';
const SUPER_ADMIN_FULL_NAME = 'Super Admin';

export async function bootstrapSuperAdmin(): Promise<void> {
  // Check if any SUPER_ADMIN already exists
  const existing = await prisma.user.findFirst({
    where: { role: Role.SUPER_ADMIN },
  });

  if (existing) {
    console.log('✓ SUPER_ADMIN already exists.');
    return;
  }

  // Hash the password with bcrypt (BCRYPT_ROUNDS = 12)
  const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD);

  // Create the SUPER_ADMIN account
  await prisma.user.create({
    data: {
      fullName: SUPER_ADMIN_FULL_NAME,
      email: SUPER_ADMIN_EMAIL,
      passwordHash,
      role: Role.SUPER_ADMIN,
      isVerified: true,
      profileCompletion: 100,
    },
  });

  console.log('✓ SUPER_ADMIN account created successfully.');
  console.log(`  Email: ${SUPER_ADMIN_EMAIL}`);
}
