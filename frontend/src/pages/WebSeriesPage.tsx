import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { genres } from '@/data/mockData';
import * as seriesService from '@/services/seriesService';
import { Series } from '@/types';

export default function WebSeriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const data = await seriesService.getAllSeries();
      setSeries(data || []);
    } catch (error) {
      console.error('Failed to fetch series:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort series
  const filteredSeries = series
    .filter((item) => {
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedGenre !== 'all' && !item.genre.toLowerCase().includes(selectedGenre.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
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
            Web Series
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Explore exciting web series from our collection
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
                placeholder="Search series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 sm:h-10 text-xs sm:text-base"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-full sm:w-48 h-9 sm:h-10 text-xs sm:text-base">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 h-9 sm:h-10 text-xs sm:text-base">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Series Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-xs sm:text-base text-muted-foreground">Loading series...</p>
          </div>
        ) : filteredSeries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredSeries.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className="cursor-pointer"
              >
                <Link to={`/series/${item._id}`}>
                  <div className="group relative rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4">
                      <h3 className="font-semibold text-white text-xs sm:text-sm mb-1">{item.title}</h3>
                      <p className="text-white/70 text-xs mb-2">{item.seasons?.length || 0} Seasons</p>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-primary/80 text-white">
                          {item.genre?.split(', ')[0] || item.genre}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-xs sm:text-base text-muted-foreground">No series found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
