import api from './api';

export interface WatchHistoryItem {
  movieId: string;
  movie: {
    _id: string;
    title: string;
    description: string;
    genre: string;
    thumbnailUrl: string;
    videoUrl: string;
  };
  progress: number;
  lastWatched: string;
}

export const watchHistoryService = {
  async getWatchHistory(): Promise<WatchHistoryItem[]> {
    try {
      const response = await api.get<WatchHistoryItem[]>('/auth/watch-history');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch watch history:', error);
      return [];
    }
  },

  async saveWatchProgress(movieId: string, progress: number): Promise<void> {
    try {
      await api.post('/auth/watch-history', {
        movieId,
        progress, // 0-100
      });
    } catch (error) {
      console.error('Failed to save watch progress:', error);
    }
  },
};
