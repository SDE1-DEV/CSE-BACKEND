import { Router } from 'express';
import {
  sendTeamInvitation,
  getMyInvitations,
  respondToInvitation,
} from '../controllers/team.controller';
import { authenticate } from '../middlewares/authenticate.middleware';
import { requireStudent } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  sendInvitationSchema,
  invitationParamsSchema,
  updateInvitationSchema,
  getInvitationsQuerySchema,
} from '../validators/team-invitation.validator';

const router = Router();

router.post('/', authenticate, requireStudent, validate(sendInvitationSchema), sendTeamInvitation);
router.get('/', authenticate, validate(getInvitationsQuerySchema), getMyInvitations);
router.patch('/:id', authenticate, requireStudent, validate(updateInvitationSchema), respondToInvitation);

export default router;
