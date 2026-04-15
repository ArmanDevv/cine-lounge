import { motion } from 'framer-motion';
import { Play, Star, Clock } from 'lucide-react';
import { Movie } from '@/types';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface MovieCardProps {
  movie: Movie;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: number;
}

const sizeClasses = {
  sm: 'w-24 h-32 sm:w-28 h-40 md:w-32 h-48',
  md: 'w-32 h-44 sm:w-40 h-56 md:w-44 h-64',
  lg: 'w-40 h-56 sm:w-48 h-64 md:w-56 h-80',
};

export function MovieCard({ movie, size = 'md', showProgress }: MovieCardProps) {
  return (
    <Link to={`/movies/${movie._id}`}>
      <motion.div
        className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden group cursor-pointer flex-shrink-0`}
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Poster Image */}
        <img
          src={movie.thumbnailUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Title - Always Visible */}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-background to-background/20">
          <h3 className="font-semibold text-foreground text-xs sm:text-sm line-clamp-2">
            {movie.title}
          </h3>
        </div>

        {/* Hover Content - Play Button */}
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            size="sm"
            className="h-10 sm:h-12 px-4 sm:px-6 text-xs sm:text-sm bg-primary hover:bg-primary/90"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/player/${movie._id}`;
            }}
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Play
          </Button>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-background/80 backdrop-blur-sm rounded px-1 sm:px-1.5 py-0.5 text-xs font-medium line-clamp-1">
          {movie.genre}
        </div>

        {/* Progress Bar */}
        {showProgress !== undefined && showProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-muted">
            <div 
              className="h-full bg-primary"
              style={{ width: `${showProgress}%` }}
            />
          </div>
        )}
      </motion.div>
    </Link>
  );
}
