import { create } from 'zustand';
import { Playlist, Movie } from '@/types';
import { mockPlaylists } from '@/data/mockData';

const STORAGE_KEY = 'cine_playlists_v1';

function loadFromStorage(): Playlist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Playlist[];
  } catch (e) {
    console.error('Failed to parse playlists from storage', e);
  }
  // fallback to mock data
  return mockPlaylists.map(p => ({ ...p }));
}

function saveToStorage(playlists: Playlist[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
  } catch (e) {
    console.error('Failed to save playlists to storage', e);
  }
}

interface PlaylistState {
  playlists: Playlist[];
  loadPlaylists: () => void;
  createPlaylist: (data: { name: string; description?: string; isPublic?: boolean; ownerId?: string }) => Playlist;
  deletePlaylist: (id: string) => void;
  addMovie: (playlistId: string, movie: Movie) => void;
  removeMovie: (playlistId: string, movieId: string) => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  loadPlaylists: () => {
    const lists = loadFromStorage();
    set({ playlists: lists });
  },
  createPlaylist: ({ name, description, isPublic = true, ownerId = 'me' }) => {
    const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newList: Playlist = {
      id,
      name,
      description,
      cover: undefined,
      movies: [],
      ownerId,
      isPublic,
      isCollaborative: false,
      members: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newList, ...get().playlists];
    set({ playlists: updated });
    saveToStorage(updated);
    return newList;
  },
  deletePlaylist: (id) => {
    const updated = get().playlists.filter(p => p.id !== id);
    set({ playlists: updated });
    saveToStorage(updated);
  },
  addMovie: (playlistId, movie) => {
    const updated = get().playlists.map(p => {
      if (p.id !== playlistId) return p;
      // avoid duplicates
      if (p.movies.some(m => (m._id || m.id) === (movie._id || movie.id))) return p;
      return { ...p, movies: [...p.movies, movie] };
    });
    set({ playlists: updated });
    saveToStorage(updated);
  },
  removeMovie: (playlistId, movieId) => {
    const updated = get().playlists.map(p => {
      if (p.id !== playlistId) return p;
      return { ...p, movies: p.movies.filter(m => (m._id || m.id) !== movieId) };
    });
    set({ playlists: updated });
    saveToStorage(updated);
  },
}));

export default usePlaylistStore;
