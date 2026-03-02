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
} from '../controllers/group.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Create a new group
router.post('/', createGroup);

// Get all groups for current user
router.get('/my-groups', getUserGroups);

// Get group by ID
router.get('/:groupId', getGroupById);

// Get group by invite code (public)
router.get('/invite/:inviteCode', getGroupByInviteCode);

// Join group via invite code
router.post('/:inviteCode/join', joinGroup);

// Add movie to group playlist
router.post('/:groupId/playlist', addToPlaylist);

// Remove movie from group playlist
router.delete('/:groupId/playlist/:movieId', removeFromPlaylist);

// Get group messages
router.get('/:groupId/messages', getGroupMessages);

// Delete group
router.delete('/:groupId', deleteGroup);

export default router;
