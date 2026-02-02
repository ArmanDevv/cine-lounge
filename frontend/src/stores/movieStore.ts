import { create } from 'zustand';
import { Movie, MovieFilters, WatchHistory } from '@/types';
import { movieService } from '@/services/movieService';
import { mockWatchHistory } from '@/data/mockData';

interface MovieState {
  movies: Movie[];
  featuredMovies: Movie[];
  trendingMovies: Movie[];
  watchHistory: WatchHistory[];
  currentMovie: Movie | null;
  filters: MovieFilters;
  isLoading: boolean;
  error: string | null;
  searchResults: Movie[];
  isSearching: boolean;

  fetchMovies: (filters?: MovieFilters) => Promise<void>;
  fetchFeaturedMovies: () => Promise<void>;
  fetchTrendingMovies: () => Promise<void>;
  fetchMovieById: (id: string) => Promise<void>;
  searchMovies: (query: string) => Promise<void>;
  setFilters: (filters: MovieFilters) => void;
  clearSearch: () => void;
}

export const useMovieStore = create<MovieState>((set, get) => ({
  movies: [],
  featuredMovies: [],
  trendingMovies: [],
  watchHistory: mockWatchHistory,
  currentMovie: null,
  filters: {},
  isLoading: false,
  error: null,
  searchResults: [],
  isSearching: false,

  fetchMovies: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await movieService.getMovies(filters || get().filters);
      set({ movies: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchFeaturedMovies: async () => {
    try {
      const movies = await movieService.getFeaturedMovies();
      set({ featuredMovies: movies });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchTrendingMovies: async () => {
    try {
      const movies = await movieService.getTrendingMovies();
      set({ trendingMovies: movies });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchMovieById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const movie = await movieService.getMovieById(id);
      set({ currentMovie: movie || null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  searchMovies: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    try {
      const results = await movieService.searchMovies(query);
      set({ searchResults: results, isSearching: false });
    } catch (error) {
      set({ isSearching: false });
    }
  },

  setFilters: (filters) => {
    set({ filters });
    get().fetchMovies(filters);
  },

  clearSearch: () => set({ searchResults: [], isSearching: false }),
}));
