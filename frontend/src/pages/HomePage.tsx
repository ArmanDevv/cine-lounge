import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HeroBanner } from '@/components/movie/HeroBanner';
import { MovieRow } from '@/components/movie/MovieRow';
import { useMovieStore } from '@/stores/movieStore';
import { genres } from '@/data/mockData';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/services/api';

interface Movie {
  _id: string;
  title: string;
  description: string;
  genre: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export default function HomePage() {
  const { 
    watchHistory,
    isLoading,
    fetchWatchHistory
  } = useMovieStore();
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
    fetchWatchHistory();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: Movie[] }>('/movies');
      // remove duplicates based on _id
      const moviesArray = response.data.data || [];
      const uniqueMovies = Array.from(
        new Map(moviesArray.map(m => [m._id, m])).values()
      );
      setMovies(uniqueMovies);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const featuredForBanner = movies.slice(0, Math.max(5, Math.floor(movies.length / 2)));
  const trendingForRow = movies;

  // Get movies by genre
  const getMoviesByGenre = (genre: string) => 
    movies.filter(m => m.genre.toLowerCase().includes(genre.toLowerCase()));

  // Continue watching movies - show real watch history
  const continueWatching = watchHistory
    .filter(h => h.progress > 0 && h.progress < 100)
    .map(h => h.movie)
    .filter(m => m && m._id); // Ensure valid movies

  // Create a map of movie IDs to progress percentages
  const progressMap: Record<string, number> = {};
  watchHistory.forEach(h => {
    if (h.progress > 0 && h.progress < 100 && h.movie && h.movie._id) {
      progressMap[h.movie._id] = h.progress;
    }
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen pt-16 sm:pt-20">
        <Skeleton className="h-[50vh] sm:h-[60vh] md:h-[75vh] w-full" />
        <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-5 sm:h-6 w-32 sm:w-48 mb-3 sm:mb-4" />
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="w-24 h-32 sm:w-32 h-44 md:w-40 h-56 rounded-lg flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen"
    >
      {/* Hero Banner */}
      <HeroBanner movies={featuredForBanner} />

      {/* Movie Rows */}
      <div className="relative z-10 py-8">
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <MovieRow 
            title="Continue Watching" 
            movies={continueWatching} 
            showProgress
            progressMap={progressMap}
          />
        )}

        {/* Trending Now */}
        <MovieRow title="Trending Now" movies={trendingForRow} size="lg" />

        {/* Genre Rows */}
        {['Action', 'Sci-Fi', 'Horror', 'Comedy'].map((genre) => {
          const genreMovies = getMoviesByGenre(genre);
          if (genreMovies.length === 0) return null;
          return (
            <MovieRow key={genre} title={genre} movies={genreMovies} />
          );
        })}

        {/* Popular This Week */}
        <MovieRow 
          title="Popular This Week" 
          movies={movies.slice(0, 8)} 
        />

        {/* New Releases */}
        <MovieRow 
          title="New Releases" 
          movies={movies.slice(0, 8)} 
        />

        {/* Top Rated */}
        <MovieRow 
          title="Top Rated" 
          movies={movies.slice(0, 8)} 
        />
      </div>
    </motion.div>
  );
}
