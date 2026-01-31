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
    <div className="relative h-[75vh] md:h-[80vh] min-h-[500px] max-h-[700px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMovie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${currentMovie.backdrop})` }}
          >
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full flex items-center px-4 md:px-16">
        <motion.div
          key={`content-${currentMovie.id}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl"
        >
          {/* Title */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground text-shadow-lg mb-4 leading-tight tracking-wide">
            {currentMovie.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center gap-4 mb-4 text-sm md:text-base text-muted-foreground">
            <span className="text-success font-semibold">
              {Math.floor(currentMovie.rating * 10)}% Match
            </span>
            <span>{currentMovie.year}</span>
            <span>{currentMovie.duration} min</span>
            <span className="px-2 py-0.5 border border-muted-foreground/50 text-xs">
              HD
            </span>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-base md:text-lg mb-6 line-clamp-3 max-w-xl">
            {currentMovie.description}
          </p>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 mb-6">
            {currentMovie.genre.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 bg-secondary/50 backdrop-blur-sm rounded-full text-sm text-secondary-foreground"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link to={`/player/${currentMovie.id}`}>
              <Button size="lg" className="btn-cinema text-lg font-semibold px-8">
                <Play className="w-5 h-5 mr-2 fill-current" />
                Play
              </Button>
            </Link>
            <Link to={`/movies/${currentMovie.id}`}>
              <Button
                size="lg"
                variant="secondary"
                className="text-lg font-semibold px-8 bg-secondary/80 backdrop-blur-sm hover:bg-secondary"
              >
                <Info className="w-5 h-5 mr-2" />
                More Info
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Mute Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-24 right-8 rounded-full border border-muted-foreground/50"
        onClick={() => setIsMuted(!isMuted)}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </Button>

      {/* Progress Indicators */}
      <div className="absolute bottom-8 right-8 flex gap-2">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 bg-primary'
                : 'w-4 bg-muted-foreground/50 hover:bg-muted-foreground'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
