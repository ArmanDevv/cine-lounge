import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  Plus, 
  Share2, 
  Star, 
  Clock, 
  Calendar, 
  User,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MovieRow } from '@/components/movie/MovieRow';
import { mockComments } from '@/data/mockData';
import api from '@/services/api';

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

export default function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [comments, setComments] = useState(mockComments);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMovie();
      fetchRecommended();
    }
  }, [id]);

  const fetchMovie = async () => {
    try {
      setLoading(true);
      console.log('Fetching movie with ID:', id);
      const response = await api.get<Movie>(`/movies/${id}`);
      console.log('Movie fetched:', response.data);
      setMovie(response.data);
    } catch (error: any) {
      console.error('Failed to fetch movie:', error.response?.status, error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    try {
      const response = await api.get<{ data: Movie[] }>('/movies');
      setRecommended((response.data.data || []).slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch recommended:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 sm:pt-20 flex items-center justify-center">
        <p className="text-xs sm:text-base text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen pt-16 sm:pt-20 flex items-center justify-center">
        <p className="text-xs sm:text-base text-muted-foreground">Movie not found</p>
      </div>
    );
  }

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    // Mock add comment
    setNewComment('');
    setUserRating(0);
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Banner */}
      <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.thumbnailUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="relative h-full flex items-end pb-6 sm:pb-8 md:pb-12 px-3 sm:px-4 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-6 md:gap-8 items-start w-full"
          >
            {/* Poster */}
            <img
              src={movie.thumbnailUrl}
              alt={movie.title}
              className="w-32 h-48 sm:w-48 md:w-64 rounded-lg sm:rounded-xl shadow-2xl flex-shrink-0"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-foreground text-shadow-lg mb-2 sm:mb-3 md:mb-4 leading-tight break-words">
                {movie.title}
              </h1>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  {new Date(movie.createdAt).getFullYear()}
                </span>
                <Badge variant="secondary" className="text-xs">
                  HD
                </Badge>
              </div>

              <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3 md:mb-4">
                {(typeof movie.genre === 'string' ? movie.genre.split(',').map(g => g.trim()) : movie.genre).map((genre) => (
                  <Badge key={genre} variant="outline" className="bg-secondary/50 text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>

              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-4 md:mb-6 leading-relaxed line-clamp-3 sm:line-clamp-4">
                {movie.description}
              </p>

              <div className="flex flex-wrap gap-2 sm:gap-3 w-full">
                <Link to={`/player/${movie._id}`} className="flex-1 sm:flex-none">
                  <Button size="sm" className="btn-cinema font-semibold w-full sm:w-auto h-9 sm:h-11 text-xs sm:text-base">
                    <Play className="w-3 h-3 sm:w-5 sm:h-5 mr-1 sm:mr-2 fill-current" />
                    Play
                  </Button>
                </Link>
                <Button size="sm" variant="secondary" className="flex-1 sm:flex-none font-semibold h-9 sm:h-11 text-xs sm:text-base">
                  <Plus className="w-3 h-3 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Playlist
                </Button>
                <Button size="sm" variant="outline" className="w-9 h-9 sm:w-auto sm:h-11 px-2 sm:px-3">
                  <Share2 className="w-3 h-3 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-16 py-8 max-w-7xl mx-auto">
        {/* Cast Section */}
        {movie.cast && movie.cast.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {movie.cast.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col items-center text-center flex-shrink-0 w-24"
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-20 h-20 rounded-full object-cover mb-2"
                  />
                  <p className="text-sm font-medium line-clamp-1">{member.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {member.character}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trailer Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Trailer</h2>
          <div className="aspect-video bg-card rounded-xl flex items-center justify-center border border-border">
            <Button size="lg" className="btn-cinema">
              <Play className="w-6 h-6 mr-2 fill-current" />
              Watch Trailer
            </Button>
          </div>
        </section>

        {/* Comments Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Reviews & Comments
          </h2>

          {/* Add Comment */}
          <div className="glass-panel rounded-xl p-4 mb-6">
            <div className="flex gap-3 mb-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setUserRating(rating)}
                  className={`w-8 h-8 rounded-full border text-sm font-medium transition-all ${
                    userRating >= rating
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-muted-foreground/50 hover:border-primary'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Write your review..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-3 bg-secondary/50"
            />
            <Button onClick={handleSubmitComment}>Submit Review</Button>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="glass-panel rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={comment.user.avatar}
                    alt={comment.user.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{comment.user.username}</span>
                      <span className="text-sm text-yellow-500 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {comment.rating}/10
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{comment.content}</p>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Helpful
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended Movies */}
        <section>
          <MovieRow title="More Like This" movies={recommended} />
        </section>
      </div>
    </div>
  );
}
