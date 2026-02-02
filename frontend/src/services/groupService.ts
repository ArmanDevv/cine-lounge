import { Group, WatchParty, ScheduledWatch, Playlist } from '@/types';
import { mockGroups, mockPlaylists, mockWatchParty, mockScheduledWatches } from '@/data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const groupService = {
  async getGroups(): Promise<Group[]> {
    await delay(300);
    return mockGroups;
  },

  async getGroupById(id: string): Promise<Group | undefined> {
    await delay(300);
    return mockGroups.find(g => g.id === id);
  },

  async createGroup(data: { name: string; description?: string }): Promise<Group> {
    await delay(500);
    const newGroup: Group = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      avatar: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200',
      ownerId: '1',
      members: [],
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    return newGroup;
  },

  async joinGroup(inviteCode: string): Promise<Group | null> {
    await delay(500);
    const group = mockGroups.find(g => g.inviteCode === inviteCode);
    return group || null;
  },

  async leaveGroup(groupId: string): Promise<void> {
    await delay(500);
  },

  async getWatchParty(groupId: string): Promise<WatchParty | null> {
    await delay(300);
    if (mockWatchParty.groupId === groupId) {
      return mockWatchParty;
    }
    return null;
  },

  async createWatchParty(groupId: string, movieId: string): Promise<WatchParty> {
    await delay(500);
    return mockWatchParty;
  },

  async getScheduledWatches(groupId: string): Promise<ScheduledWatch[]> {
    await delay(300);
    return mockScheduledWatches.filter(sw => sw.groupId === groupId);
  },

  async scheduleWatch(groupId: string, movieId: string, scheduledAt: string): Promise<ScheduledWatch> {
    await delay(500);
    return mockScheduledWatches[0];
  },

  async rsvpToWatch(scheduleId: string): Promise<void> {
    await delay(300);
  },

  // Playlist methods
  async getPlaylists(): Promise<Playlist[]> {
    await delay(300);
    return mockPlaylists;
  },

  async getPlaylistById(id: string): Promise<Playlist | undefined> {
    await delay(300);
    return mockPlaylists.find(p => p.id === id);
  },

  async createPlaylist(data: { name: string; description?: string; isPublic: boolean }): Promise<Playlist> {
    await delay(500);
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      movies: [],
      ownerId: '1',
      isPublic: data.isPublic,
      isCollaborative: false,
      createdAt: new Date().toISOString(),
    };
    return newPlaylist;
  },

  async addToPlaylist(playlistId: string, movieId: string): Promise<void> {
    await delay(300);
  },

  async removeFromPlaylist(playlistId: string, movieId: string): Promise<void> {
    await delay(300);
  },
};
