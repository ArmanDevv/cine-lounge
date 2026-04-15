import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, Volume2, VolumeX } from 'lucide-react';
import { Movie } from '@/types';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface HeroBannerProps {
  movies: Movie[];
}

export function HeroBanner({ movies }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const currentMovie = movies[currentIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [movies.length]);

  if (!currentMovie) return null;

  return (
    <div className="relative h-[50vh] sm:h-[60vh] md:h-[75vh] lg:h-[80vh] min-h-[400px] max-h-[700px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMovie._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${currentMovie.thumbnailUrl})` }}
          >
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full flex items-center px-4 sm:px-6 md:px-12 lg:px-16 pt-16 sm:pt-20 pb-16 sm:pb-24 md:pb-32">
        <motion.div
          key={`content-${currentMovie._id}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl w-full"
        >
          {/* Title */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl text-foreground text-shadow-lg mb-2 sm:mb-3 md:mb-4 leading-tight tracking-wide">
            {currentMovie.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base text-muted-foreground flex-wrap">
            <span className="text-success font-semibold">
              New Upload
            </span>
            <span className="px-1.5 sm:px-2 py-0.5 border border-muted-foreground/50 text-xs">
              HD
            </span>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-6 line-clamp-2 sm:line-clamp-3 max-w-xl hidden sm:block">
            {currentMovie.description}
          </p>

          {/* Genres */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4 md:mb-6 hidden sm:flex">
            {(typeof currentMovie.genre === 'string' ? currentMovie.genre.split(',').map(g => g.trim()) : currentMovie.genre).map((genre) => (
              <span
                key={genre}
                className="px-2 sm:px-3 py-0.5 sm:py-1 bg-secondary/50 backdrop-blur-sm rounded-full text-xs sm:text-sm text-secondary-foreground"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link to={`/player/${currentMovie._id}`}>
              <Button size="sm" className="btn-cinema text-xs sm:text-sm md:text-lg font-semibold px-4 sm:px-6 md:px-8">
                <Play className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2 fill-current" />
                Play
              </Button>
            </Link>
            <Link to={`/movies/${currentMovie._id}`}>
              <Button
                size="sm"
                variant="secondary"
                className="text-xs sm:text-sm md:text-lg font-semibold px-4 sm:px-6 md:px-8 bg-secondary/80 backdrop-blur-sm hover:bg-secondary"
              >
                <Info className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />
                Info
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Mute Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-12 sm:bottom-16 md:bottom-24 right-4 sm:right-6 md:right-8 rounded-full border border-muted-foreground/50"
        onClick={() => setIsMuted(!isMuted)}
      >
        {isMuted ? <VolumeX className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />}
      </Button>

      {/* Progress Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 flex gap-1 sm:gap-2">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-0.5 sm:h-1 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-6 sm:w-8 bg-primary'
                : 'w-2 sm:w-4 bg-muted-foreground/50 hover:bg-muted-foreground'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
