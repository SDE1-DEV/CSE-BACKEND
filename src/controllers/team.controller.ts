import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/team.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { PROJECT_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../constants';
import { TeamMemberRole } from '@prisma/client';

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Team management
 */

const requireAuth = (req: AuthenticatedRequest): string => {
  if (!req.user) throw new AppError(HTTP_STATUS.UNAUTHORIZED, 'Unauthorized');
  return req.user.userId;
};

// ── Teams ──────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/teams:
 *   post:
 *     tags: [Teams]
 *     summary: Create a team
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeamRequest'
 *     responses:
 *       201:
 *         description: Team created
 */
export const createTeam = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    const team = await teamService.createTeam(req.body, userId);
    sendCreated(res, PROJECT_MESSAGES.TEAM_CREATED, team);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     tags: [Teams]
 *     summary: Get team by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Team fetched
 */
export const getTeamById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const team = await teamService.getTeamById(req.params.id);
    sendSuccess(res, PROJECT_MESSAGES.TEAM_FETCHED, team);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/teams/{id}:
 *   put:
 *     tags: [Teams]
 *     summary: Update a team (Owner/Leader only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Updated
 */
export const updateTeam = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    const team = await teamService.updateTeam(req.params.id, req.body, userId);
    sendSuccess(res, PROJECT_MESSAGES.TEAM_UPDATED, team);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     tags: [Teams]
 *     summary: Delete a team (Owner only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Deleted
 */
export const deleteTeam = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    await teamService.deleteTeam(req.params.id, userId);
    sendSuccess(res, PROJECT_MESSAGES.TEAM_DELETED, null);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/my-teams:
 *   get:
 *     tags: [Teams]
 *     summary: Get all teams the current user belongs to
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: My teams fetched
 */
export const getMyTeams = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    const teams = await teamService.getMyTeams(userId);
    sendSuccess(res, PROJECT_MESSAGES.MY_TEAMS_FETCHED, teams);
  } catch (error) {
    next(error);
  }
};

// ── Members ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/teams/{id}/members:
 *   post:
 *     tags: [Teams]
 *     summary: Add a member to a team (Owner/Leader only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddTeamMemberRequest'
 *     responses:
 *       201:
 *         description: Member added
 */
export const addTeamMember = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    const { userId: targetUserId, role } = req.body as { userId: string; role?: TeamMemberRole };
    const member = await teamService.addMember(
      req.params.id,
      targetUserId,
      (role as TeamMemberRole) ?? TeamMemberRole.DEVELOPER,
      userId,
    );
    sendCreated(res, PROJECT_MESSAGES.MEMBER_ADDED, member);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/teams/{id}/members/{memberId}:
 *   delete:
 *     tags: [Teams]
 *     summary: Remove a member from a team (Owner only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Member removed
 */
export const removeTeamMember = async (
  req: AuthenticatedRequest & Request<{ id: string; memberId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    await teamService.removeMember(req.params.id, req.params.memberId, userId);
    sendSuccess(res, PROJECT_MESSAGES.MEMBER_REMOVED, null);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/teams/{id}/members/{memberId}:
 *   patch:
 *     tags: [Teams]
 *     summary: Update member role (Owner only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMemberRoleRequest'
 *     responses:
 *       200:
 *         description: Role updated
 */
export const updateTeamMemberRole = async (
  req: AuthenticatedRequest & Request<{ id: string; memberId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    const { role } = req.body as { role: TeamMemberRole };
    const member = await teamService.updateMemberRole(req.params.id, req.params.memberId, role, userId);
    sendSuccess(res, PROJECT_MESSAGES.MEMBER_UPDATED, member);
  } catch (error) {
    next(error);
  }
};

// ── Invitations ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/team-invitations:
 *   post:
 *     tags: [Teams]
 *     summary: Send a team invitation (Owner/Leader only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendInvitationRequest'
 *     responses:
 *       201:
 *         description: Invitation sent
 */
export const sendTeamInvitation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    const invitation = await teamService.sendInvitation(req.body, userId);
    sendCreated(res, PROJECT_MESSAGES.INVITATION_SENT, invitation);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/team-invitations:
 *   get:
 *     tags: [Teams]
 *     summary: Get my invitations (sent or received)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sent, received]
 *           default: received
 *     responses:
 *       200:
 *         description: Invitations fetched
 */
export const getMyInvitations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    const type = (req.query.type as 'sent' | 'received') ?? 'received';
    const invitations = await teamService.getMyInvitations(userId, type);
    sendSuccess(res, PROJECT_MESSAGES.INVITATIONS_FETCHED, invitations);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/team-invitations/{id}:
 *   patch:
 *     tags: [Teams]
 *     summary: Respond to a team invitation (accept/reject)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateInvitationRequest'
 *     responses:
 *       200:
 *         description: Invitation updated
 */
export const respondToInvitation = async (
  req: AuthenticatedRequest & Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = requireAuth(req);
    const result = await teamService.respondToInvitation(req.params.id, req.body, userId);
    const msg =
      req.body.status === 'ACCEPTED'
        ? PROJECT_MESSAGES.INVITATION_ACCEPTED
        : PROJECT_MESSAGES.INVITATION_REJECTED;
    sendSuccess(res, msg, result);
  } catch (error) {
    next(error);
  }
};
