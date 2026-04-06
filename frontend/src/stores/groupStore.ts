import { create } from 'zustand';
import { groupService, Group } from '@/services/groupService';

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  messages: Group['messages'];
  isLoading: boolean;
  error: string | null;

  // Group methods
  fetchUserGroups: () => Promise<void>;
  fetchGroupById: (id: string) => Promise<void>;
  createGroup: (name: string, description?: string) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<Group>;
  deleteGroup: (groupId: string) => Promise<void>;

  // Playlist methods
  addToPlaylist: (groupId: string, movieId: string) => Promise<void>;
  removeFromPlaylist: (groupId: string, movieId: string) => Promise<void>;

  // Message methods
  fetchMessages: (groupId: string) => Promise<void>;
  addMessage: (message: Group['messages'][0]) => void;
  setCurrentGroup: (group: Group | null) => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroup: null,
  messages: [],
  isLoading: false,
  error: null,

  fetchUserGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const groups = await groupService.getUserGroups();
      set({ groups, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchGroupById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const group = await groupService.getGroupById(id);
      set({ 
        currentGroup: group, 
        messages: group.messages || [],
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createGroup: async (name, description) => {
    try {
      const group = await groupService.createGroup({ name, description });
      set(state => ({
        groups: [...state.groups, group],
        currentGroup: group,
      }));
      return group;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  joinGroup: async (inviteCode) => {
    try {
      const group = await groupService.joinGroup(inviteCode);
      set(state => ({
        groups: [...state.groups, group],
        currentGroup: group,
      }));
      return group;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteGroup: async (groupId) => {
    try {
      await groupService.deleteGroup(groupId);
      set(state => ({
        groups: state.groups.filter(g => g._id !== groupId),
        currentGroup: state.currentGroup?._id === groupId ? null : state.currentGroup,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  addToPlaylist: async (groupId, movieId) => {
    try {
      const group = await groupService.addToPlaylist(groupId, movieId);
      set(state => ({
        groups: state.groups.map(g => (g._id === groupId ? group : g)),
        currentGroup: state.currentGroup?._id === groupId ? group : state.currentGroup,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  removeFromPlaylist: async (groupId, movieId) => {
    try {
      const group = await groupService.removeFromPlaylist(groupId, movieId);
      set(state => ({
        groups: state.groups.map(g => (g._id === groupId ? group : g)),
        currentGroup: state.currentGroup?._id === groupId ? group : state.currentGroup,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchMessages: async (groupId) => {
    try {
      const messages = await groupService.getGroupMessages(groupId);
      set({ messages });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addMessage: (message) => {
    set(state => ({ 
      messages: [...state.messages, message],
      currentGroup: state.currentGroup ? {
        ...state.currentGroup,
        messages: [...state.currentGroup.messages, message]
      } : null
    }));
  },

  setCurrentGroup: (group) => {
    set({ currentGroup: group });
  },
}));
