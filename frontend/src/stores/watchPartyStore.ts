import { create } from 'zustand';
import { Movie } from '@/types';

export interface WatchPartyMember {
  userId: string;
  username: string;
  avatar: string;
  isHost: boolean;
}

export interface WatchPartyChatMessage {
  userId: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: string;
}

export interface WatchPartyState {
  isActive: boolean;
  groupId: string | null;
  currentMovie: Movie | null;
  currentTime: number;
  isPlaying: boolean;
  members: WatchPartyMember[];
  messages: WatchPartyChatMessage[];
  hostId: string | null;

  // Actions
  startWatchParty: (groupId: string, movie: Movie, hostId: string, hostUsername: string, hostAvatar: string) => void;
  joinWatchParty: (groupId: string, movie: Movie, member: WatchPartyMember) => void;
  updatePlaybackState: (currentTime: number, isPlaying: boolean) => void;
  addMember: (member: WatchPartyMember) => void;
  removeMember: (userId: string) => void;
  addMessage: (message: WatchPartyChatMessage) => void;
  endWatchParty: () => void;
}

export const useWatchPartyStore = create<WatchPartyState>((set) => ({
  isActive: false,
  groupId: null,
  currentMovie: null,
  currentTime: 0,
  isPlaying: false,
  members: [],
  messages: [],
  hostId: null,

  startWatchParty: (groupId, movie, hostId, hostUsername, hostAvatar) => {
    set({
      isActive: true,
      groupId,
      currentMovie: movie,
      currentTime: 0,
      isPlaying: false,
      hostId,
      members: [
        {
          userId: hostId,
          username: hostUsername,
          avatar: hostAvatar,
          isHost: true,
        },
      ],
      messages: [],
    });
  },

  joinWatchParty: (groupId, movie, member) => {
    set((state) => ({
      isActive: true,
      groupId,
      currentMovie: movie,
      members: [...state.members, member],
      messages: [],
    }));
  },

  updatePlaybackState: (currentTime, isPlaying) => {
    set({
      currentTime,
      isPlaying,
    });
  },

  addMember: (member) => {
    set((state) => ({
      members: [...state.members, member],
    }));
  },

  removeMember: (userId) => {
    set((state) => ({
      members: state.members.filter((m) => m.userId !== userId),
    }));
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  endWatchParty: () => {
    set({
      isActive: false,
      groupId: null,
      currentMovie: null,
      currentTime: 0,
      isPlaying: false,
      members: [],
      messages: [],
      hostId: null,
    });
  },
}));
