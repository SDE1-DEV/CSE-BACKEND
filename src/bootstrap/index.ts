/**
 * PRD-08.1: Bootstrap entry point
 *
 * Runs all startup bootstrap tasks in sequence.
 * Called from server.ts after database connection is established.
 */

import { bootstrapSuperAdmin } from './superAdmin.bootstrap';

export async function runBootstrap(): Promise<void> {
  await bootstrapSuperAdmin();
}
