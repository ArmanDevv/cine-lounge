import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  Subtitles,
  PictureInPicture2,
  Users,
  ArrowLeft,
  MonitorPlay,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { mockMovies } from '@/data/mockData';

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(7200); // 2 hours in seconds
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [isWatchParty, setIsWatchParty] = useState(false);
  const [isPiP, setIsPiP] = useState(false);

  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const movie = mockMovies.find((m) => m.id === id) || mockMovies[0];

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => Math.min(prev + 1, duration));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={playerRef}
      className={`relative bg-black ${
        isTheaterMode ? 'fixed inset-0 z-50' : 'min-h-screen pt-16'
      }`}
    >
      {/* Video Area */}
      <div className="relative w-full aspect-video bg-black">
        {/* Fake video background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.backdrop})` }}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Play/Pause Overlay */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Button
                size="lg"
                className="w-20 h-20 rounded-full btn-cinema"
                onClick={() => setIsPlaying(true)}
              >
                <Play className="w-10 h-10 fill-current ml-1" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"
            >
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                <Link to={`/movies/${movie.id}`}>
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <h2 className="font-display text-xl text-foreground text-shadow">
                  {movie.title}
                </h2>
                <div className="flex items-center gap-2">
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
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {/* Progress Bar */}
                <div className="mb-4">
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={1}
                    onValueChange={(value) => setCurrentTime(value[0])}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between">
                  {/* Left Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                    >
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-12 h-12"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-0.5" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
                    >
                      <SkipForward className="w-5 h-5" />
                    </Button>

                    {/* Volume */}
                    <div className="flex items-center gap-2 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </Button>
                      <div className="w-24">
                        <Slider
                          value={[isMuted ? 0 : volume]}
                          max={100}
                          step={1}
                          onValueChange={(value) => {
                            setVolume(value[0]);
                            setIsMuted(value[0] === 0);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-2">
                    {/* Subtitles */}
                    <Button
                      variant={showSubtitles ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setShowSubtitles(!showSubtitles)}
                    >
                      <Subtitles className="w-5 h-5" />
                    </Button>

                    {/* Settings */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Settings className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-xs text-muted-foreground">
                          Playback Speed
                        </DropdownMenuItem>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <DropdownMenuItem
                            key={speed}
                            onClick={() => setPlaybackSpeed(speed)}
                            className={playbackSpeed === speed ? 'bg-accent' : ''}
                          >
                            {speed}x
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs text-muted-foreground">
                          Quality
                        </DropdownMenuItem>
                        <DropdownMenuItem>1080p HD</DropdownMenuItem>
                        <DropdownMenuItem>720p</DropdownMenuItem>
                        <DropdownMenuItem>480p</DropdownMenuItem>
                        <DropdownMenuItem>Auto</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* PiP */}
                    <Button
                      variant={isPiP ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setIsPiP(!isPiP)}
                    >
                      <PictureInPicture2 className="w-5 h-5" />
                    </Button>

                    {/* Theater Mode */}
                    <Button
                      variant={isTheaterMode ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setIsTheaterMode(!isTheaterMode)}
                    >
                      <MonitorPlay className="w-5 h-5" />
                    </Button>

                    {/* Fullscreen */}
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                      {isFullscreen ? (
                        <Minimize className="w-5 h-5" />
                      ) : (
                        <Maximize className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtitles (Mock) */}
        {showSubtitles && isPlaying && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
            <p className="text-lg bg-black/60 px-4 py-2 rounded text-center max-w-2xl">
              "The universe is not only queerer than we suppose, but queerer than we can suppose."
            </p>
          </div>
        )}
      </div>

      {/* Watch Party Sidebar */}
      {isWatchParty && !isTheaterMode && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="fixed right-0 top-16 bottom-0 w-80 bg-card border-l border-border p-4 flex flex-col"
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
