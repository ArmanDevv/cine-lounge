import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Upload,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { genres } from '@/data/mockData';
import MovieUploadForm from '@/components/admin/MovieUploadForm';
import api from '@/services/api';
import * as movieUploadService from '@/services/movieUploadService';

interface Movie {
  _id: string;
  title: string;
  description: string;
  genre: string;
  thumbnailUrl: string;
  videoUrl: string;
  uploadedBy: any;
  createdAt: string;
}

const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-matroska'];
const MAX_SIZE_MB = Number(import.meta.env.VITE_MAX_VIDEO_SIZE_MB || 1024);

export default function AdminMoviesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const [editProgress, setEditProgress] = useState(0);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    genre: '',
    thumbnailUrl: '',
    videoUrl: ''
  });
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await api.get<Movie[]>('/admin/movies');
      setMovies(response.data);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieAdded = () => {
    setShowAddModal(false);
    fetchMovies();
  };

  const handleEditClick = (movie: Movie) => {
    setEditingMovie(movie);
    setEditFormData({
      title: movie.title,
      description: movie.description,
      genre: movie.genre,
      thumbnailUrl: movie.thumbnailUrl,
      videoUrl: movie.videoUrl
    });
    setEditVideoFile(null);
    setShowEditModal(true);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const f = e.target.files[0];
    if (!allowedMimes.includes(f.type)) {
      toast({ title: 'Invalid file type', description: 'Only mp4, mov and mkv are allowed', variant: 'destructive' });
      return;
    }

    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Max video size is ${MAX_SIZE_MB} MB`, variant: 'destructive' });
      return;
    }

    setEditVideoFile(f);
  };

  const handleUpdateMovie = async () => {
    if (!editingMovie) return;

    try {
      setEditUploading(true);
      setEditProgress(0);

      let videoUrl = editFormData.videoUrl;

      // If a new video file is selected, upload it
      if (editVideoFile) {
        const { uploadUrl, videoUrl: newVideoUrl } = await movieUploadService.requestUploadUrl(editVideoFile);
        await movieUploadService.uploadVideoToS3(uploadUrl, editVideoFile, (p) => setEditProgress(p));
        videoUrl = newVideoUrl;
      }

      // Update movie with new data
      await api.put(`/admin/movies/${editingMovie._id}`, {
        title: editFormData.title,
        description: editFormData.description,
        genre: editFormData.genre,
        thumbnailUrl: editFormData.thumbnailUrl,
        videoUrl: videoUrl
      });

      toast({ title: 'Success', description: 'Movie updated successfully', variant: 'default' });
      setShowEditModal(false);
      setEditingMovie(null);
      setEditVideoFile(null);
      fetchMovies();
    } catch (error: any) {
      console.error('Failed to update movie:', error);
      toast({ title: 'Failed', description: error?.response?.data?.message || 'Failed to update movie', variant: 'destructive' });
    } finally {
      setEditUploading(false);
      setEditProgress(0);
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) {
      return;
    }

    try {
      await api.delete(`/admin/movies/${movieId}`);
      fetchMovies();
    } catch (error) {
      console.error('Failed to delete movie:', error);
      toast({ title: 'Failed', description: 'Failed to delete movie', variant: 'destructive' });
    }
  };

  const filteredMovies = movies.filter(
    (movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl text-foreground mb-2">
              Manage Movies
            </h1>
            <p className="text-muted-foreground">
              Add, edit, and manage your movie catalog
            </p>
          </div>

          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="btn-cinema">
                <Plus className="w-4 h-4 mr-2" />
                Add Movie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Movie</DialogTitle>
              </DialogHeader>

              {/* Upload form - handles presigned upload flow */}
              <MovieUploadForm
                onClose={handleMovieAdded}
                genres={genres}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-secondary/50"
          />
        </div>

        {/* Movies Table */}
        <div className="glass-panel rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading movies...</div>
          ) : filteredMovies.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No movies found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-16">Poster</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovies.map((movie) => (
                  <TableRow key={movie._id} className="border-border">
                    <TableCell>
                      <img
                        src={movie.thumbnailUrl}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{movie.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{movie.genre}</Badge>
                    </TableCell>
                    <TableCell>{movie.uploadedBy?.username || 'Unknown'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditClick(movie)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => handleDeleteMovie(movie._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </motion.div>

      {/* Edit Movie Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Movie</DialogTitle>
          </DialogHeader>
          {editingMovie && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  placeholder="Movie title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="mt-1"
                  disabled={editUploading}
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Movie description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="mt-1"
                  rows={4}
                  disabled={editUploading}
                />
              </div>

              <div>
                <Label htmlFor="edit-genre">Genre</Label>
                <Select
                  value={editFormData.genre}
                  onValueChange={(value) => setEditFormData({ ...editFormData, genre: value })}
                  disabled={editUploading}
                >
                  <SelectTrigger id="edit-genre" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-thumbnail">Thumbnail URL</Label>
                <Input
                  id="edit-thumbnail"
                  placeholder="Thumbnail URL"
                  value={editFormData.thumbnailUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, thumbnailUrl: e.target.value })}
                  className="mt-1"
                  disabled={editUploading}
                />
              </div>

              <div>
                <Label htmlFor="edit-video">Video File (Optional - Upload new video to replace current)</Label>
                <input 
                  id="edit-video"
                  type="file" 
                  accept="video/mp4,video/quicktime,video/x-matroska" 
                  onChange={handleEditFileChange}
                  className="mt-2"
                  disabled={editUploading}
                />
                {editVideoFile && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    Selected: {editVideoFile.name} ({(editVideoFile.size / (1024*1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {editUploading && (
                <div>
                  <Label>Uploading</Label>
                  <div className="w-full bg-secondary/30 rounded h-2 mt-2">
                    <div className="bg-primary h-2 rounded" style={{ width: `${editProgress}%` }} />
                  </div>
                  <p className="text-sm mt-1">{editProgress}%</p>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={editUploading}
                >
                  Cancel
                </Button>
                <Button
                  className="btn-cinema"
                  onClick={handleUpdateMovie}
                  disabled={editUploading}
                >
                  {editUploading ? `Uploading (${editProgress}%)` : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
