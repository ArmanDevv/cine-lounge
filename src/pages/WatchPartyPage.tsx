import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Send,
  Smile,
  Users,
  Crown,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { mockGroups, mockWatchParty, mockChatMessages, mockMovies } from '@/data/mockData';

export default function WatchPartyPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(1234);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [message, setMessage] = useState('');
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isInCall, setIsInCall] = useState(false);

  const watchParty = mockWatchParty;
  const group = mockGroups.find((g) => g.id === (groupId || '1'));
  const messages = mockChatMessages;
  const movie = watchParty.movie || mockMovies[4];

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    setMessage('');
  };

  return (
    <div className="min-h-screen pt-16 bg-background">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Content - Video Player */}
        <div className="flex-1 flex flex-col">
          {/* Video Area */}
          <div className="relative flex-1 bg-black">
            {/* Video Background */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${movie.backdrop})` }}
            >
              <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* Sync Status Badge */}
            <div className="absolute top-4 left-4 z-10">
              <Badge variant="secondary" className="bg-success/20 text-success border-success/50">
                <RefreshCw className="w-3 h-3 mr-1" />
                Synced
              </Badge>
            </div>

            {/* Video Call Overlay */}
            {showVideoCall && isInCall && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-4 right-4 z-10 grid grid-cols-2 gap-2"
              >
                {watchParty.participants.slice(0, 4).map((participant, index) => (
                  <div
                    key={participant.id}
                    className="w-32 h-24 rounded-lg overflow-hidden bg-card border border-border relative"
                  >
                    <img
                      src={participant.avatar}
                      alt={participant.username}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 right-1">
                      <p className="text-xs truncate bg-black/60 px-1 rounded">
                        {participant.username}
                      </p>
                    </div>
                    {!isMicOn && (
                      <div className="absolute top-1 right-1">
                        <MicOff className="w-3 h-3 text-destructive" />
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Controls Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6">
              {/* Progress Bar */}
              <div className="mb-4">
                <Slider
                  value={[currentTime]}
                  max={movie.duration * 60}
                  step={1}
                  onValueChange={(value) => setCurrentTime(value[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(movie.duration * 60)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
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
                    onClick={() => setCurrentTime(currentTime + 10)}
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>

                  {/* Volume */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
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
                  {/* Video Call Controls */}
                  {showVideoCall && (
                    <div className="flex items-center gap-1 mr-4 px-3 py-1 bg-secondary/50 rounded-full">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsCameraOn(!isCameraOn)}
                      >
                        {isCameraOn ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <VideoOff className="w-4 h-4 text-destructive" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsMicOn(!isMicOn)}
                      >
                        {isMicOn ? (
                          <Mic className="w-4 h-4" />
                        ) : (
                          <MicOff className="w-4 h-4 text-destructive" />
                        )}
                      </Button>
                      <Button
                        variant={isInCall ? 'destructive' : 'default'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsInCall(!isInCall)}
                      >
                        {isInCall ? (
                          <PhoneOff className="w-4 h-4" />
                        ) : (
                          <Phone className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}

                  <Button
                    variant={showVideoCall ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setShowVideoCall(!showVideoCall)}
                  >
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Maximize className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Movie Info Bar */}
          <div className="p-4 border-t border-border flex items-center justify-between bg-card">
            <div className="flex items-center gap-4">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-12 h-16 object-cover rounded"
              />
              <div>
                <h3 className="font-semibold">{movie.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {movie.year} • {movie.duration} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Synced at {formatTime(currentTime)}</span>
              </div>
              <Button variant="outline" size="sm">
                Leave Party
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Chat & Members */}
        <div className="w-80 border-l border-border flex flex-col bg-card">
          {/* Party Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Watch Party
              </h3>
              <Badge variant="secondary">
                {watchParty.participants.length} watching
              </Badge>
            </div>
            
            {/* Participants */}
            <div className="flex -space-x-2">
              {watchParty.participants.map((user, index) => (
                <div key={user.id} className="relative">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full border-2 border-card"
                  />
                  {user.id === watchParty.hostId && (
                    <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" />
                  )}
                  {user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <img
                    src={msg.sender.avatar}
                    alt={msg.sender.username}
                    className="w-6 h-6 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium truncate">
                        {msg.sender.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground break-words">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Send a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-secondary/50"
              />
              <Button variant="ghost" size="icon">
                <Smile className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                className="btn-cinema"
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
