import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Loader2, X, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/stores/authStore';
import { useWatchPartyStore } from '@/stores/watchPartyStore';
import { socketClient } from '@/services/socketClient';
import { movieService } from '@/services/movieService';
import { Movie } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface WatchPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onStartWatchParty: (movie: Movie) => void;
  hasActiveWatchParty?: boolean;
}

export default function WatchPartyModal({
  isOpen,
  onClose,
  groupId,
  onStartWatchParty,
}: WatchPartyModalProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const { user } = useAuthStore();
  const { startWatchParty } = useWatchPartyStore();
  const { toast } = useToast();

  // Load available movies
  useEffect(() => {
    if (isOpen) {
      fetchMovies();
    }
  }, [isOpen]);

  const fetchMovies = async () => {
    try {
      setIsLoadingMovies(true);
      const response = await movieService.getMovies();
      setMovies(response.data || []);
    } catch (error: any) {
      console.error('Failed to load movies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load movies',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMovies(false);
    }
  };

  const handleStartWatchParty = () => {
    if (!selectedMovie || !user) return;

    // Safety check: prevent creating watch party if one already exists
    const { isActive } = useWatchPartyStore.getState();
    if (isActive) {
      toast({
        title: 'Watch Party Already Active',
        description: 'A watch party is already running in this group. Join it instead.',
        variant: 'destructive',
      });
      onClose();
      return;
    }

    try {
      // Start watch party locally
      startWatchParty(groupId, selectedMovie, user.id, user.username, user.avatar || '');

      // Notify other members
      socketClient.emit('start_watch_party', {
        groupId,
        movie: selectedMovie,
        hostId: user.id,
        hostUsername: user.username,
        hostAvatar: user.avatar || '',
        timestamp: new Date().toISOString(),
      });

      // Callback to show player
      onStartWatchParty(selectedMovie);

      // Close modal
      onClose();

      toast({
        title: 'Success',
        description: 'Watch party started! Others can now join.',
      });
    } catch (error: any) {
      console.error('Error starting watch party:', error);
      toast({
        title: 'Error',
        description: 'Failed to start watch party',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select Movie for Watch Party</DialogTitle>
        </DialogHeader>

        {isLoadingMovies ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading movies...</p>
            </div>
          </div>
        ) : movies.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No movies available</p>
          </div>
        ) : (
          <>
            {/* Movie Grid */}
            <ScrollArea className="flex-1 pr-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {movies.map((movie) => (
                  <motion.div
                    key={movie._id}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedMovie(movie)}
                    className={`cursor-pointer relative group rounded-lg overflow-hidden transition-all ${
                      selectedMovie?._id === movie._id
                        ? 'ring-2 ring-primary shadow-lg shadow-primary/50'
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={movie.thumbnailUrl || movie.poster}
                        alt={movie.title}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="bg-card p-3">
                      <h4 className="text-sm font-medium line-clamp-2">
                        {movie.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {movie.genre}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            {/* Selected Movie Info & Action */}
            {selectedMovie && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-border pt-4 gap-4 grid grid-cols-3"
              >
                <div className="col-span-1">
                  <img
                    src={selectedMovie.thumbnailUrl || selectedMovie.poster}
                    alt={selectedMovie.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedMovie.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedMovie.genre}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {selectedMovie.description}
                    </p>
                  </div>
                  <Button
                    onClick={handleStartWatchParty}
                    className="btn-cinema w-full"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Watch Party
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
