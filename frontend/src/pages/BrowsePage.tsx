import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MovieCard } from '@/components/movie/MovieCard';
import { genres } from '@/data/mockData';
import api from '@/services/api';

interface Movie {
  _id: string;
  title: string;
  description: string;
  genre: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('trending');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);

      const response = await api.get<{ data: Movie[] }>('/movies');
      setMovies(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort movies
  const filteredMovies = movies
    .filter((movie) => {
      if (searchQuery && !movie.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedGenre !== 'all' && !movie.genre.toLowerCase().includes(selectedGenre.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'trending':
        case 'popular':
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen pt-16 sm:pt-20 pb-8 sm:pb-12 px-3 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-foreground mb-1 sm:mb-2">
            Browse Movies
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Discover your next favorite film from our collection
          </p>
        </div>

        {/* Filters Bar */}
        <div className="glass-panel rounded-xl p-3 sm:p-4 mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 sm:h-11 bg-secondary/50 text-xs sm:text-sm"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-full sm:w-36 h-9 sm:h-11 bg-secondary/50 text-xs sm:text-sm">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-36 h-9 sm:h-11 bg-secondary/50 text-xs sm:text-sm">
                  <SlidersHorizontal className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg ml-auto sm:ml-0">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 sm:mb-6 text-xs sm:text-sm text-muted-foreground">
          {loading ? 'Loading...' : `Showing ${filteredMovies.length} movies`}
        </div>

        {/* Movies Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4 md:gap-5 lg:gap-6">
            {filteredMovies.map((movie, index) => (
              <motion.div
                key={movie._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex justify-center"
              >
                <MovieCard movie={movie} size="md" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-4">
            {filteredMovies.map((movie, index) => (
              <motion.div
                key={movie._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-panel rounded-lg sm:rounded-xl p-2 sm:p-4 flex gap-2 sm:gap-4 hover:bg-accent/50 transition-colors"
              >
                <img
                  src={movie.thumbnailUrl}
                  alt={movie.title}
                  className="w-16 h-24 sm:w-24 sm:h-36 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xs sm:text-lg text-foreground mb-0.5 sm:mb-1 line-clamp-2">
                    {movie.title}
                  </h3>
                  <div className="text-xs text-muted-foreground mb-1 sm:mb-2">
                    <span>{movie.genre}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                    {movie.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredMovies.length === 0 && (
          <div className="text-center py-8 sm:py-16">
            <p className="text-base sm:text-xl text-muted-foreground mb-3 sm:mb-4">No movies found</p>
            <Button onClick={() => {
              setSearchQuery('');
              setSelectedGenre('all');
            }} className="text-xs sm:text-base">
              Clear Filters
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
