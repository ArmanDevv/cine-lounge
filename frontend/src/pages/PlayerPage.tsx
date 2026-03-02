import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { watchHistoryService } from '@/services/watchHistoryService';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

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

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWatchParty, setIsWatchParty] = useState(false);

  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const lastSaveTimeRef = useRef<number>(0);

  useEffect(() => {
    if (id) {
      fetchMovie();
    }
  }, [id]);

  const fetchMovie = async () => {
    try {
      setLoading(true);
      console.log('Fetching movie with ID:', id);
      const response = await api.get<Movie>(`/movies/${id}`);
      console.log('Movie fetched:', response.data);
      console.log('Raw Video URL:', response.data.videoUrl);
      
      // Fix URL if it's missing https://
      let videoUrl = response.data.videoUrl;
      if (videoUrl && !videoUrl.startsWith('http')) {
        videoUrl = `https://${videoUrl}`;
        console.log('Fixed Video URL:', videoUrl);
      }
      
      

      // Create new movie object with corrected URL
      const movieData = { ...response.data, videoUrl };
      setMovie(movieData);
    } catch (error: any) {
      console.error('Failed to fetch movie:', error.response?.status, error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize video.js player with built-in controls
  useEffect(() => {
    if (!movie?.videoUrl || !videoRef.current) return; 

    // Wait for video element to be ready
    const videoElement = videoRef.current.querySelector('video');
    if (!videoElement) return;

    // Initialize playif  built-in controls
    const player = videojs(videoElement, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      width: '100%',
      height: '100%',
      html5: {
        nativeControlsForTouch: false,
      },
      controlBar: {
        children: [
          'playToggle',
          'progressControl',
          'volumePanel',
          'playbackRateMenuButton',
          'qualitySelector',
          'captionsButton',
          'subtitlesButton',
          'fullscreenToggle',
        ]
      }
    });

    playerRef.current = player;

    // Save watch progress every 10 seconds
    const progressInterval = setInterval(() => {
      if (player && movie?._id) {
        const currentTime = player.currentTime();
        const duration = player.duration();
        
        if (currentTime > 0 && duration > 0) {
          const progress = Math.round((currentTime / duration) * 100);
          
          // Only save if progress changed or 30+ seconds since last save
          if (Date.now() - lastSaveTimeRef.current > 30000) {
            watchHistoryService.saveWatchProgress(movie._id, progress);
            lastSaveTimeRef.current = Date.now();
          }
        }
      }
    }, 10000);

    return () => {
      clearInterval(progressInterval);
      player.dispose();
    };
  }, [movie?.videoUrl, movie?._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading player...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Movie not found</p>
      </div>
    );
  }

  return (
    <div className="relative bg-background min-h-screen">
      {/* Video Player Container */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-12">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <Link to={`/movies/${movie._id}`}>-
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="absolute top-4 right-4 z-10">
            <Button
              variant={isWatchParty ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setIsWatchParty(!isWatchParty)}
              className={isWatchParty ? 'bg-primary' : ''}
            >
              <Users className="w-4 h-4 mr-2" />
              Watch Party
            </Button>
          </div>

          <div className="w-full aspect-video bg-black">
            {movie?.videoUrl && (
              <div ref={videoRef} className="w-full h-full">
                <video
                  className="video-js vjs-default-skin"
                  controls
                  preload="auto"
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: '100%' }}
                >
                  <source src={movie.videoUrl} type="video/mp4" />
                </video>
              </div>
            )}
          </div>
        </div>

        {/* Movie Info Section */}
        <div className="mt-6 mb-12 px-2">
          <h1 className="text-3xl font-bold text-foreground mb-2">{movie.title}</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Genre: <span className="text-foreground">{movie.genre}</span>
          </p>
          <p className="text-foreground leading-relaxed">{movie.description}</p>
        </div>
      </div>

      {/* Watch Party Sidebar */}
      {isWatchParty && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="fixed right-0 top-16 bottom-0 w-80 bg-card border-l border-border p-4 flex flex-col overflow-y-auto"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Watch Party
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Invite friends to watch together in sync!
          </p>
          <Button className="btn-cinema mb-4">Create Watch Party</Button>
          <div className="flex-1 bg-secondary/30 rounded-lg p-4">
            <p className="text-center text-muted-foreground text-sm">
              No active watch party. Create one to start!
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
