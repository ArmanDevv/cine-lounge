import { motion } from 'framer-motion';
import { Play, Plus, Star, Clock } from 'lucide-react';
import { Movie } from '@/types';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface MovieCardProps {
  movie: Movie;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: number;
}

const sizeClasses = {
  sm: 'w-32 h-48',
  md: 'w-44 h-64',
  lg: 'w-56 h-80',
};

export function MovieCard({ movie, size = 'md', showProgress }: MovieCardProps) {
  return (
    <Link to={`/movies/${movie.id}`}>
      <motion.div
        className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden group cursor-pointer flex-shrink-0`}
        whileHover={{ scale: 1.05, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Poster Image */}
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <h3 className="font-semibold text-foreground text-sm line-clamp-2 text-shadow mb-1">
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {movie.rating}
            </span>
            <span>{movie.year}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {movie.duration}m
            </span>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-1 mt-2">
            <Button
              size="sm"
              className="flex-1 h-7 text-xs bg-primary hover:bg-primary/90"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/player/${movie.id}`;
              }}
            >
              <Play className="w-3 h-3 mr-1" />
              Play
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 w-7 p-0"
              onClick={(e) => e.preventDefault()}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-xs font-medium flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          {movie.rating}
        </div>

        {/* Progress Bar */}
        {showProgress !== undefined && showProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
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
