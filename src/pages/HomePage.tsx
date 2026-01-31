import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeroBanner } from '@/components/movie/HeroBanner';
import { MovieRow } from '@/components/movie/MovieRow';
import { useMovieStore } from '@/stores/movieStore';
import { mockMovies, genres } from '@/data/mockData';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { 
    featuredMovies, 
    trendingMovies, 
    watchHistory,
    fetchFeaturedMovies, 
    fetchTrendingMovies,
    isLoading 
  } = useMovieStore();

  useEffect(() => {
    fetchFeaturedMovies();
    fetchTrendingMovies();
  }, []);

  const featuredForBanner = featuredMovies.length > 0 ? featuredMovies : mockMovies.filter(m => m.featured);
  const trendingForRow = trendingMovies.length > 0 ? trendingMovies : mockMovies;

  // Get movies by genre
  const getMoviesByGenre = (genre: string) => 
    mockMovies.filter(m => m.genre.includes(genre));

  // Continue watching movies
  const continueWatching = watchHistory
    .filter(h => h.progress > 0 && h.progress < 100)
    .map(h => h.movie);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16">
        <Skeleton className="h-[85vh] w-full" />
        <div className="px-8 py-8 space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="w-44 h-64 rounded-lg flex-shrink-0" />
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
          movies={[...mockMovies].sort((a, b) => b.views - a.views).slice(0, 8)} 
        />

        {/* New Releases */}
        <MovieRow 
          title="New Releases" 
          movies={[...mockMovies].sort((a, b) => b.year - a.year).slice(0, 8)} 
        />

        {/* Top Rated */}
        <MovieRow 
          title="Top Rated" 
          movies={[...mockMovies].sort((a, b) => b.rating - a.rating).slice(0, 8)} 
        />
      </div>
    </motion.div>
  );
}
