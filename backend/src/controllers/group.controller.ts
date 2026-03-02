import { Request, Response } from 'express';
import Group from '../models/Group';
import User from '../models/User';

// Generate unique invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = (req as any).userId;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let codeExists = await Group.findOne({ inviteCode });
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await Group.findOne({ inviteCode });
    }

    const newGroup = new Group({
      name,
      description: description || '',
      createdBy: userId,
      members: [{ userId, joinedAt: new Date() }],
      inviteCode,
      playlist: [],
      messages: [],
    });

    await newGroup.save();

    const populatedGroup = await Group.findById(newGroup._id)
      .populate('createdBy', 'username avatar')
      .populate('members.userId', 'username avatar')
      .populate('playlist.addedBy', 'username');

    res.status(201).json({
      message: 'Group created successfully',
      group: populatedGroup,
    });
  } catch (error: any) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getGroupByInviteCode = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.params;

    const group = await Group.findOne({ inviteCode })
      .populate('createdBy', 'username avatar')
      .populate('members.userId', 'username avatar')
      .populate('playlist.movieId', 'title genre thumbnailUrl')
      .populate('playlist.addedBy', 'username');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json(group);
  } catch (error: any) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: error.message });
  }
};

export const joinGroup = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.params;
    const userId = (req as any).userId;

    const group = await Group.findOne({ inviteCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user already in group
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (isMember) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    group.members.push({ userId, joinedAt: new Date() });
    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'username avatar')
      .populate('members.userId', 'username avatar')
      .populate('playlist.movieId', 'title genre thumbnailUrl')
      .populate('playlist.addedBy', 'username');

    res.status(200).json({
      message: 'Joined group successfully',
      group: populatedGroup,
    });
  } catch (error: any) {
    console.error('Error joining group:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate('createdBy', 'username avatar')
      .populate('members.userId', 'username avatar')
      .populate('playlist.movieId', 'title genre thumbnailUrl videoUrl')
      .populate('playlist.addedBy', 'username')
      .populate('messages.senderId', 'username avatar');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json(group);
  } catch (error: any) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: error.message });
  }
};

export const addToPlaylist = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { movieId } = req.body;
    const userId = (req as any).userId;

    if (!movieId) {
      return res.status(400).json({ message: 'Movie ID is required' });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Check if movie already in playlist
    const alreadyAdded = group.playlist.some((p) => p.movieId.toString() === movieId);
    if (alreadyAdded) {
      return res.status(400).json({ message: 'Movie already in playlist' });
    }

    // Add to playlist
    group.playlist.push({
      movieId: movieId as any,
      addedBy: userId as any,
      addedAt: new Date(),
    });

    await group.save();

    const populatedGroup = await Group.findById(groupId)
      .populate('createdBy', 'username avatar')
      .populate('members.userId', 'username avatar')
      .populate('playlist.movieId', 'title genre thumbnailUrl videoUrl')
      .populate('playlist.addedBy', 'username');

    res.status(200).json({
      message: 'Added to playlist',
      group: populatedGroup,
    });
  } catch (error: any) {
    console.error('Error adding to playlist:', error);
    res.status(500).json({ message: error.message || 'Failed to add to playlist' });
  }
};

export const removeFromPlaylist = async (req: Request, res: Response) => {
  try {
    const { groupId, movieId } = req.params;
    const userId = (req as any).userId;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member
    const isMember = group.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    group.playlist = group.playlist.filter((p) => p.movieId.toString() !== movieId);

    await group.save();

    const populatedGroup = await Group.findById(groupId)
      .populate('playlist.movieId', 'title genre thumbnailUrl')
      .populate('playlist.addedBy', 'username');

    res.status(200).json({
      message: 'Removed from playlist',
      group: populatedGroup,
    });
  } catch (error: any) {
    console.error('Error removing from playlist:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getGroupMessages = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate(
      'messages.senderId',
      'username avatar'
    );

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json({
      messages: group.messages,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).userId;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only creator can delete
    if (group.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only group creator can delete the group' });
    }

    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserGroups = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const groups = await Group.find({
      'members.userId': userId,
    })
      .populate('createdBy', 'username avatar')
      .populate('members.userId', 'username avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error: any) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ message: error.message });
  }
};
