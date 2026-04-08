import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, LogOut, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWatchPartyStore } from '@/stores/watchPartyStore';
import { useAuthStore } from '@/stores/authStore';
import { socketClient } from '@/services/socketClient';
import { useToast } from '@/hooks/use-toast';
import AgoraVideoCall from '@/components/AgoraVideoCall';
import VideoCallInvitationModal from '@/components/VideoCallInvitationModal';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface WatchPartyPlayerProps {
  onClose: () => void;
  groupId: string;
}

export default function WatchPartyPlayer({ onClose, groupId }: WatchPartyPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const lastEmittedTimeRef = useRef<number>(0);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [movieVolume, setMovieVolume] = useState(100);
  const [videoCallInvitation, setVideoCallInvitation] = useState<{
    initiatorName: string;
    initiatorAvatar?: string;
    initiatedBy: string;
  } | null>(null);

  const { currentMovie, hostId, updatePlaybackState } = useWatchPartyStore();

  // Initialize video player
  useEffect(() => {
    if (!currentMovie?.videoUrl || !videoRef.current) return;

    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.innerHTML = '';
    }

    const video = document.createElement('video');
    video.className = 'video-js vjs-default-skin';
    video.setAttribute('controls', 'true');
    video.setAttribute('preload', 'auto');
    videoRef.current?.appendChild(video);

    const player = videojs(video, {
      controls: true,
      autoplay: false,
      preload: 'auto',
      responsive: true,
      fluid: true,
      controlBar: {
        fullscreenToggle: true,
      },
    });

    playerRef.current = player;

    let videoUrl = currentMovie.videoUrl;
    if (videoUrl && videoUrl.includes('https://https://')) {
      videoUrl = videoUrl.replace('https://https://', 'https://');
    }
    if (videoUrl && !videoUrl.startsWith('http')) {
      videoUrl = `https://${videoUrl}`;
    }

    console.log('Setting video source:', videoUrl);
    player.src({ src: videoUrl, type: 'video/mp4' });

    const handlePlay = () => {
      try {
        updatePlaybackState(player.currentTime(), true);
        socketClient.emit('watch_party_play', {
          groupId,
          timestamp: player.currentTime(),
          userId: user?.id,
        });
      } catch (error) {
        console.error('Error on play:', error);
      }
    };

    const handlePause = () => {
      try {
        updatePlaybackState(player.currentTime(), false);
        socketClient.emit('watch_party_pause', {
          groupId,
          timestamp: player.currentTime(),
          userId: user?.id,
        });
      } catch (error) {
        console.error('Error on pause:', error);
      }
    };

    const handleSeeking = () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        const newTime = player.currentTime();
        if (Math.abs(newTime - lastEmittedTimeRef.current) > 0.5) {
          lastEmittedTimeRef.current = newTime;
          try {
            updatePlaybackState(newTime, player.paused() ? false : true);
            socketClient.emit('watch_party_seek', {
              groupId,
              timestamp: newTime,
              userId: user?.id,
            });
          } catch (error) {
            console.error('Error on seek:', error);
          }
        }
      }, 100);
    };

    player.on('play', handlePlay);
    player.on('pause', handlePause);
    player.on('seeking', handleSeeking);

    return () => {
      player.off('play', handlePlay);
      player.off('pause', handlePause);
      player.off('seeking', handleSeeking);
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [currentMovie, groupId, updatePlaybackState, user?.id]);

  // Update movie volume
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.volume(movieVolume / 100);
    }
  }, [movieVolume]);

  // Sync playback when receiving updates from other members
  useEffect(() => {
    const handlePlaySync = (data: any) => {
      if (!playerRef.current) return;
      const timeDiff = Math.abs(playerRef.current.currentTime() - data.timestamp);
      if (timeDiff > 1) {
        playerRef.current.currentTime(data.timestamp);
      }
      if (playerRef.current.paused()) {
        playerRef.current.play().catch(() => {
          console.log('Autoplay prevented');
        });
      }
    };

    const handlePauseSync = (data: any) => {
      if (!playerRef.current) return;
      const timeDiff = Math.abs(playerRef.current.currentTime() - data.timestamp);
      if (timeDiff > 1) {
        playerRef.current.currentTime(data.timestamp);
      }
      if (!playerRef.current.paused()) {
        playerRef.current.pause();
      }
    };

    const handleSeekSync = (data: any) => {
      if (!playerRef.current) return;
      playerRef.current.currentTime(data.timestamp);
    };

    const handlePlaybackSyncRequest = async (data: any) => {
      if (user?.id !== hostId) return;
      if (playerRef.current) {
        socketClient.emit('playback_sync_response', {
          groupId,
          currentTime: playerRef.current.currentTime(),
          isPlaying: !playerRef.current.paused(),
          timestamp: new Date().toISOString(),
        });
      }
    };

    const handlePlaybackSyncResponse = (data: any) => {
      if (!playerRef.current) return;
      playerRef.current.currentTime(data.currentTime);
      if (data.isPlaying && playerRef.current.paused()) {
        playerRef.current.play().catch(() => {
          console.log('Autoplay prevented');
        });
      } else if (!data.isPlaying && !playerRef.current.paused()) {
        playerRef.current.pause();
      }
      console.log('Synced to host:', data);
    };

    socketClient.on('watch_party_play', handlePlaySync);
    socketClient.on('watch_party_pause', handlePauseSync);
    socketClient.on('watch_party_seek', handleSeekSync);
    socketClient.on('request_playback_sync', handlePlaybackSyncRequest);
    socketClient.on('playback_sync_response', handlePlaybackSyncResponse);

    return () => {
      socketClient.off('watch_party_play', handlePlaySync);
      socketClient.off('watch_party_pause', handlePauseSync);
      socketClient.off('watch_party_seek', handleSeekSync);
      socketClient.off('request_playback_sync', handlePlaybackSyncRequest);
      socketClient.off('playback_sync_response', handlePlaybackSyncResponse);
    };
  }, [user?.id, hostId, groupId]);

  // Handle video call state synchronization
  useEffect(() => {
    const handleVideoCallSelfStarted = (data: any) => {
      console.log('You initiated the video call');
      setShowVideoCall(true);
      toast({
        title: 'Video Call Started',
        description: 'Starting your video call...',
      });
    };

    const handleVideoCallInvitation = (data: any) => {
      console.log('Video call invitation received from:', data.initiatorName);
      setVideoCallInvitation({
        initiatorName: data.initiatorName,
        initiatorAvatar: data.initiatorAvatar,
        initiatedBy: data.initiatedBy,
      });
    };

    const handleVideoCallEnded = (data: any) => {
      console.log('Video call ended');
      setShowVideoCall(false);
      setVideoCallInvitation(null);
    };

    socketClient.on('video_call_self_started', handleVideoCallSelfStarted);
    socketClient.on('video_call_invitation', handleVideoCallInvitation);
    socketClient.on('video_call_ended', handleVideoCallEnded);

    return () => {
      socketClient.off('video_call_self_started', handleVideoCallSelfStarted);
      socketClient.off('video_call_invitation', handleVideoCallInvitation);
      socketClient.off('video_call_ended', handleVideoCallEnded);
    };
  }, [groupId, toast]);

  const handleVideoCallToggle = (newState: boolean) => {
    setShowVideoCall(newState);

    if (newState) {
      socketClient.emit('video_call_started', {
        groupId,
        initiatedBy: user?.id,
        initiatorName: user?.name || user?.username || 'User',
        initiatorAvatar: user?.avatar,
        timestamp: new Date().toISOString(),
      });
    } else {
      socketClient.emit('video_call_ended', {
        groupId,
        initiatedBy: user?.id,
      });
    }
  };

  const handleAcceptVideoCall = () => {
    setShowVideoCall(true);
    setVideoCallInvitation(null);
    socketClient.emit('video_call_join', {
      groupId,
      userId: user?.id,
      userName: user?.name || user?.username || 'User',
      userAvatar: user?.avatar,
    });
  };

  const handleRejectVideoCall = () => {
    setVideoCallInvitation(null);
  };

  const handleLeaveWatchParty = () => {
    socketClient.emit('leave_watch_party', { groupId });
    if (user?.id === hostId) {
      socketClient.emit('end_watch_party', { groupId });
    }
    onClose();
    toast({
      title: 'Left Watch Party',
      description: 'You have left the watch party',
    });
  };

  if (!currentMovie) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No movie selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="flex-shrink-0 bg-card/90 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h2 className="text-lg font-semibold truncate text-white">{currentMovie.title}</h2>
          {user?.id === hostId && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Host</span>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <Button
            variant={showVideoCall ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleVideoCallToggle(!showVideoCall)}
            className="gap-2 whitespace-nowrap"
          >
            {showVideoCall ? (
              <>
                <Video className="w-4 h-4" />
                <span>Video ({participantCount})</span>
              </>
            ) : (
              <>
                <VideoOff className="w-4 h-4" />
                <span>Start Video</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveWatchParty}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT - Two sections: Movie and Video Call */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* MOVIE PLAYER SECTION */}
        <div
          className="flex flex-col gap-3 p-4 overflow-hidden"
          style={{
            flex: showVideoCall ? '0 0 auto' : '1 1 auto',
          }}
        >
          {/* Video Player */}
          <div
            className="bg-black rounded-xl overflow-hidden shadow-lg border border-slate-700"
            style={{
              width: '100%',
              height: showVideoCall ? '300px' : '100%',
              minHeight: showVideoCall ? '300px' : 'auto',
            }}
          >
            <div ref={videoRef} className="w-full h-full" />
          </div>

          {/* Movie Volume Control */}
          <div className="flex items-center gap-3 bg-card/60 backdrop-blur rounded-lg border border-border/50 px-4 py-2.5 flex-shrink-0">
            <span className="text-sm font-medium text-white whitespace-nowrap">Movie</span>
            <input
              type="range"
              min="0"
              max="100"
              value={movieVolume}
              onChange={(e) => setMovieVolume(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
              title="Movie volume"
            />
            <span className="text-sm font-medium text-white w-10 text-right">{movieVolume}</span>
          </div>
        </div>

        {/* VIDEO CALL SECTION - Only shows when active */}
        {showVideoCall && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col border-t border-border/50 p-4 overflow-hidden gap-3"
          >
            <AgoraVideoCall
              groupId={groupId}
              userId={user.id}
              onParticipantCountChange={setParticipantCount}
              onCallEnded={() => setShowVideoCall(false)}
              onError={(error) => {
                toast({
                  title: 'Video Call Error',
                  description: error,
                  variant: 'destructive',
                });
                setShowVideoCall(false);
              }}
            />
          </motion.div>
        )}
      </div>

      {/* VIDEO CALL INVITATION MODAL */}
      {videoCallInvitation && (
        <VideoCallInvitationModal
          isOpen={!!videoCallInvitation}
          initiatorName={videoCallInvitation.initiatorName}
          initiatorAvatar={videoCallInvitation.initiatorAvatar}
          onAccept={handleAcceptVideoCall}
          onReject={handleRejectVideoCall}
        />
      )}
    </div>
  );
}
