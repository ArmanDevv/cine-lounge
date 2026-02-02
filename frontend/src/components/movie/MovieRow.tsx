import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '@/types';
import { MovieCard } from './MovieCard';
import { Button } from '@/components/ui/button';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export function MovieRow({ title, movies, size = 'md', showProgress }: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScrollButtons, 300);
    }
  };

  if (!movies.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative py-4"
    >
      <h2 className="text-xl font-semibold text-foreground mb-4 px-4 md:px-8">
        {title}
      </h2>

      <div className="relative group">
        {/* Left Arrow */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full rounded-none bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}

        {/* Movies Container */}
        <div
          ref={scrollRef}
          className="scroll-row px-4 md:px-8"
          onScroll={checkScrollButtons}
        >
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <MovieCard 
                movie={movie} 
                size={size}
                showProgress={showProgress ? 75 : undefined}
              />
            </motion.div>
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full rounded-none bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}
      </div>
    </motion.section>
  );
}
