import { Router } from 'express';
import {
  createTeam,
  getTeamById,
  updateTeam,
  deleteTeam,
  getMyTeams as _getMyTeams,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  sendTeamInvitation,
  getMyInvitations,
  respondToInvitation,
} from '../controllers/team.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createTeamSchema,
  updateTeamSchema,
  teamParamsSchema,
  teamMemberParamsSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from '../validators/team.validator';
import {
  sendInvitationSchema,
  invitationParamsSchema as _invitationParamsSchema,
  updateInvitationSchema as _updateInvitationSchema,
  getInvitationsQuerySchema as _getInvitationsQuerySchema,
} from '../validators/team-invitation.validator';

const router = Router();

// ── Teams ──────────────────────────────────────────────────────────────────────
router.post('/', authenticate, requireStudent, validate(createTeamSchema), createTeam);
router.get('/:id', authenticate, validate(teamParamsSchema), getTeamById);
router.put('/:id', authenticate, requireStudent, validate(updateTeamSchema), updateTeam);
router.delete('/:id', authenticate, requireStudent, validate(teamParamsSchema), deleteTeam);

// ── Members ────────────────────────────────────────────────────────────────────
router.post('/:id/members', authenticate, requireStudent, validate(addMemberSchema), addTeamMember);
router.delete('/:id/members/:memberId', authenticate, requireStudent, validate(teamMemberParamsSchema), removeTeamMember);
router.patch('/:id/members/:memberId', authenticate, requireStudent, validate(updateMemberRoleSchema), updateTeamMemberRole);

export { sendTeamInvitation, getMyInvitations, respondToInvitation };
export default router;
