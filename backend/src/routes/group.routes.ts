import { Router, Request, Response } from 'express';
import {
  createGroup,
  getGroupByInviteCode,
  joinGroup,
  getGroupById,
  addToPlaylist,
  removeFromPlaylist,
  getGroupMessages,
  deleteGroup,
  getUserGroups,
  getAgoraToken,
} from '../controllers/group.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Special routes (must be before :groupId routes)
router.get('/my-groups', getUserGroups);
router.get('/invite/:inviteCode', getGroupByInviteCode);

// Group ID routes
router.get('/:groupId', getGroupById);
router.post('/:groupId/playlist', addToPlaylist);
router.delete('/:groupId/playlist/:movieId', removeFromPlaylist);
router.get('/:groupId/messages', getGroupMessages);
router.get('/:groupId/agora-token', getAgoraToken);
router.delete('/:groupId', deleteGroup);

// Create a new group
router.post('/', createGroup);

// Join group via invite code
router.post('/:inviteCode/join', joinGroup);

export default router;
