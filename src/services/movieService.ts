import { Movie, MovieFilters, Comment, PaginatedResponse } from '@/types';
import { mockMovies, mockComments } from '@/data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const movieService = {
  async getMovies(filters?: MovieFilters): Promise<PaginatedResponse<Movie>> {
    await delay(500);
    let filtered = [...mockMovies];

    if (filters?.genre) {
      filtered = filtered.filter(m => m.genre.includes(filters.genre!));
    }
    if (filters?.year) {
      filtered = filtered.filter(m => m.year === filters.year);
    }
    if (filters?.minRating) {
      filtered = filtered.filter(m => m.rating >= filters.minRating!);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(search) ||
        m.description.toLowerCase().includes(search)
      );
    }
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'trending':
          filtered.sort((a, b) => b.views - a.views);
          break;
        case 'newest':
          filtered.sort((a, b) => b.year - a.year);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
      }
    }

    return {
      data: filtered,
      total: filtered.length,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  },

  async getMovieById(id: string): Promise<Movie | undefined> {
    await delay(300);
    return mockMovies.find(m => m.id === id);
  },

  async getFeaturedMovies(): Promise<Movie[]> {
    await delay(300);
    return mockMovies.filter(m => m.featured);
  },

  async getTrendingMovies(): Promise<Movie[]> {
    await delay(300);
    return [...mockMovies].sort((a, b) => b.views - a.views).slice(0, 10);
  },

  async getMoviesByGenre(genre: string): Promise<Movie[]> {
    await delay(300);
    return mockMovies.filter(m => m.genre.includes(genre));
  },

  async getRecommendedMovies(movieId: string): Promise<Movie[]> {
    await delay(300);
    const movie = mockMovies.find(m => m.id === movieId);
    if (!movie) return [];
    return mockMovies
      .filter(m => m.id !== movieId && m.genre.some(g => movie.genre.includes(g)))
      .slice(0, 6);
  },

  async getComments(movieId: string): Promise<Comment[]> {
    await delay(300);
    return mockComments.filter(c => c.movieId === movieId);
  },

  async addComment(movieId: string, content: string, rating: number): Promise<Comment> {
    await delay(500);
    const newComment: Comment = {
      id: Date.now().toString(),
      movieId,
      userId: '1',
      user: mockMovies[0].cast[0] as any,
      content,
      rating,
      createdAt: new Date().toISOString(),
    };
    return newComment;
  },

  async searchMovies(query: string): Promise<Movie[]> {
    await delay(300);
    const search = query.toLowerCase();
    return mockMovies.filter(m =>
      m.title.toLowerCase().includes(search) ||
      m.genre.some(g => g.toLowerCase().includes(search))
    );
  },
};
