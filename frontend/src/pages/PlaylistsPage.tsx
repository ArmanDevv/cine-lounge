import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, ListVideo, Lock, Trash2, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePlaylistStore } from '@/stores/playlistStore';
import { MovieCard } from '@/components/movie/MovieCard';
import { Link } from 'react-router-dom';
import { movieService } from '@/services/movieService';
import { useToast } from '@/hooks/use-toast';
import { Movie } from '@/types';

export default function PlaylistsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [showMovieDialog, setShowMovieDialog] = useState(false);
  const [availableMovies, setAvailableMovies] = useState<Movie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);

  const { playlists, loadPlaylists, createPlaylist, deletePlaylist } = usePlaylistStore();
  const { toast } = useToast();
  const displayPlaylists = playlists;
  const currentPlaylist = displayPlaylists.find(p => p.id === selectedPlaylist);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    const created = createPlaylist({ name: newPlaylistName.trim(), description: newPlaylistDescription.trim(), isPublic: false });
    setShowCreateModal(false);
    setNewPlaylistName('');
    setNewPlaylistDescription('');
    setSelectedPlaylist(created.id);
  };

  const fetchAvailableMovies = async () => {
    setIsLoadingMovies(true);
    try {
      const response = await movieService.getMovies();
      setAvailableMovies(response.data || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load movies',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMovies(false);
    }
  };

  const handleAddMovieToPlaylist = async (movieId: string) => {
    if (!selectedPlaylist) return;
    try {
      // Find the playlist and add the movie to it
      const playlist = playlists.find(p => p.id === selectedPlaylist);
      if (playlist) {
        const movie = availableMovies.find(m => m._id === movieId);
        if (movie && !playlist.movies.some(m => m.id === movieId)) {
          playlist.movies.push({ id: movieId, poster: movie.thumbnailUrl, title: movie.title });
          setShowMovieDialog(false);
          toast({
            title: 'Success',
            description: 'Movie added to playlist',
          });
        } else if (playlist.movies.some(m => m.id === movieId)) {
          toast({
            title: 'Already Added',
            description: 'This movie is already in the playlist',
            variant: 'destructive',
          });
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add movie to playlist',
        variant: 'destructive',
      });
    }
  };

  const handleOpenMovieDialog = () => {
    fetchAvailableMovies();
    setShowMovieDialog(true);
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl text-foreground mb-2">My Playlists</h1>
            <p className="text-muted-foreground">
              Create and manage your movie collections
            </p>
          </div>

          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="btn-cinema">
                <Plus className="w-4 h-4 mr-2" />
                Create Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Playlist Name</Label>
                  <Input
                    placeholder="Enter playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    placeholder="What's this playlist about?"
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <Button onClick={handleCreatePlaylist} className="w-full btn-cinema">
                  Create Playlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-8">
          {/* Playlists List */}
          <div className="w-80 space-y-4">
            {displayPlaylists.map((playlist) => (
              <motion.div
                key={playlist.id}
                whileHover={{ scale: 1.02 }}
                className={`glass-panel rounded-xl p-4 cursor-pointer transition-all ${
                  selectedPlaylist === playlist.id
                    ? 'ring-2 ring-primary'
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => setSelectedPlaylist(playlist.id)}
              >
                <div className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {playlist.movies[0] ? (
                      <img
                        src={playlist.movies[0].poster}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <ListVideo className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {playlist.movies.length} movies
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Private
                      </span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedPlaylist(playlist.id); }}>
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={(e) => { e.stopPropagation(); if (confirm('Delete this playlist?')) deletePlaylist(playlist.id); }}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {displayPlaylists.length === 0 && (
              <div className="text-center py-8">
                <ListVideo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No playlists yet</p>
              </div>
            )}
          </div>

          {/* Playlist Content */}
          <div className="flex-1">
            {currentPlaylist ? (
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{currentPlaylist.name}</h2>
                    <p className="text-muted-foreground">
                      {currentPlaylist.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {currentPlaylist.movies.length > 0 ? (
                  <div>
                    <div className="mb-4">
                      <Dialog open={showMovieDialog} onOpenChange={setShowMovieDialog}>
                        <DialogTrigger asChild>
                          <Button onClick={handleOpenMovieDialog} className="btn-cinema">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Movies
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add Movie to Playlist</DialogTitle>
                          </DialogHeader>
                          {isLoadingMovies ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              {availableMovies.map((movie) => (
                                <div
                                  key={movie._id}
                                  className="cursor-pointer group"
                                  onClick={() => handleAddMovieToPlaylist(movie._id)}
                                >
                                  <div className="relative mb-2 overflow-hidden rounded-lg">
                                    <img
                                      src={movie.thumbnailUrl || ''}
                                      alt={movie.title}
                                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <Plus className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                  <h4 className="text-sm font-medium line-clamp-2">
                                    {movie.title}
                                  </h4>
                                </div>
                              ))}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {currentPlaylist.movies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} size="md" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 glass-panel rounded-xl">
                    <ListVideo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      This playlist is empty
                    </p>
                    <Dialog open={showMovieDialog} onOpenChange={setShowMovieDialog}>
                      <DialogTrigger asChild>
                        <Button onClick={handleOpenMovieDialog} className="btn-cinema">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Movies
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Movie to Playlist</DialogTitle>
                        </DialogHeader>
                        {isLoadingMovies ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            {availableMovies.map((movie) => (
                              <div
                                key={movie._id}
                                className="cursor-pointer group"
                                onClick={() => handleAddMovieToPlaylist(movie._id)}
                              >
                                <div className="relative mb-2 overflow-hidden rounded-lg">
                                  <img
                                    src={movie.thumbnailUrl || ''}
                                    alt={movie.title}
                                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Plus className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                                <h4 className="text-sm font-medium line-clamp-2">
                                  {movie.title}
                                </h4>
                              </div>
                            ))}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                )}}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <ListVideo className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a playlist</h3>
                  <p className="text-muted-foreground">
                    Choose a playlist from the left to view its contents
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
