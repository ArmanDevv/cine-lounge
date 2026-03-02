import api from './api';
import { Movie, MovieFilters, Comment, PaginatedResponse } from '@/types';

export const movieService = {
  async getMovies(filters?: MovieFilters): Promise<PaginatedResponse<Movie>> {
    try {
      const response = await api.get<PaginatedResponse<Movie>>('/movies', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch movies:', error);
      throw error;
    }
  },

  async getMovieById(id: string): Promise<Movie> {
    const response = await api.get<Movie>(`/movies/${id}`);
    return response.data;
  },

  async getMoviesByGenre(genre: string): Promise<Movie[]> {
    const response = await api.get<Movie[]>('/movies', {
      params: { genre },
    });
    return response.data.data || [];
  },

  async getComments(movieId: string): Promise<Comment[]> {
    const response = await api.get<Comment[]>(`/movies/${movieId}/comments`);
    return response.data;
  },

  async addComment(movieId: string, content: string, rating: number): Promise<Comment> {
    const response = await api.post<Comment>(`/movies/${movieId}/comments`, {
      content,
      rating,
    });
    return response.data;
  },

  async deleteComment(movieId: string, commentId: string): Promise<void> {
    await api.delete(`/movies/${movieId}/comments/${commentId}`);
  },

  async likeMovie(movieId: string): Promise<void> {
    await api.post(`/movies/${movieId}/like`);
  },

  async unlikeMovie(movieId: string): Promise<void> {
    await api.post(`/movies/${movieId}/unlike`);
  },
};

