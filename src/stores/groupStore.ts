import { create } from 'zustand';
import { Group, Playlist, WatchParty, ChatMessage, ScheduledWatch } from '@/types';
import { groupService } from '@/services/groupService';
import { chatService } from '@/services/chatService';

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  watchParty: WatchParty | null;
  scheduledWatches: ScheduledWatch[];
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  fetchGroups: () => Promise<void>;
  fetchGroupById: (id: string) => Promise<void>;
  createGroup: (name: string, description?: string) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<Group | null>;
  
  fetchPlaylists: () => Promise<void>;
  fetchPlaylistById: (id: string) => Promise<void>;
  createPlaylist: (name: string, description?: string, isPublic?: boolean) => Promise<Playlist>;
  
  fetchWatchParty: (groupId: string) => Promise<void>;
  createWatchParty: (groupId: string, movieId: string) => Promise<void>;
  
  fetchScheduledWatches: (groupId: string) => Promise<void>;
  
  fetchMessages: (groupId: string) => Promise<void>;
  sendMessage: (groupId: string, content: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  playlists: [],
  currentPlaylist: null,
  watchParty: null,
  scheduledWatches: [],
  messages: [],
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true });
    try {
      const groups = await groupService.getGroups();
      set({ groups, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchGroupById: async (id) => {
    set({ isLoading: true });
    try {
      const group = await groupService.getGroupById(id);
      set({ currentGroup: group || null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createGroup: async (name, description) => {
    const group = await groupService.createGroup({ name, description });
    set(state => ({ groups: [...state.groups, group] }));
    return group;
  },

  joinGroup: async (inviteCode) => {
    const group = await groupService.joinGroup(inviteCode);
    if (group) {
      set(state => ({ groups: [...state.groups, group] }));
    }
    return group;
  },

  fetchPlaylists: async () => {
    set({ isLoading: true });
    try {
      const playlists = await groupService.getPlaylists();
      set({ playlists, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchPlaylistById: async (id) => {
    try {
      const playlist = await groupService.getPlaylistById(id);
      set({ currentPlaylist: playlist || null });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createPlaylist: async (name, description, isPublic = true) => {
    const playlist = await groupService.createPlaylist({ name, description, isPublic });
    set(state => ({ playlists: [...state.playlists, playlist] }));
    return playlist;
  },

  fetchWatchParty: async (groupId) => {
    try {
      const watchParty = await groupService.getWatchParty(groupId);
      set({ watchParty });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createWatchParty: async (groupId, movieId) => {
    const watchParty = await groupService.createWatchParty(groupId, movieId);
    set({ watchParty });
  },

  fetchScheduledWatches: async (groupId) => {
    try {
      const scheduledWatches = await groupService.getScheduledWatches(groupId);
      set({ scheduledWatches });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchMessages: async (groupId) => {
    try {
      const messages = await chatService.getMessages(groupId);
      set({ messages });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  sendMessage: async (groupId, content) => {
    const message = await chatService.sendMessage(groupId, content);
    set(state => ({ messages: [...state.messages, message] }));
  },

  addMessage: (message) => {
    set(state => ({ messages: [...state.messages, message] }));
  },
}));
