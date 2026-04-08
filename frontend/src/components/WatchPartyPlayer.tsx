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
import WatchPartyChat from '@/components/WatchPartyChat';
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
  const [movieVolume, setMovieVolume] = useState(100); // Movie volume (0-100)
  const [videoCallInvitation, setVideoCallInvitation] = useState<{
    initiatorName: string;
    initiatorAvatar?: string;
    initiatedBy: string;
  } | null>(null);

  const {
    currentMovie,
    currentTime,
    isPlaying,
    members,
    hostId,
    groupId: storeGroupId,
    updatePlaybackState,
    addMessage,
  } = useWatchPartyStore();

  // Debug: Log component state
  useEffect(() => {
    console.log(`%c=== WatchPartyPlayer Mounted ===`, 'color: yellow; font-weight: bold');
    console.log('GroupId:', groupId);
    console.log('User ID:', user?.id);
    console.log('User:', user?.username);
    console.log('Socket connected:', socketClient.isConnected());
    
    return () => {
      console.log(`%c=== WatchPartyPlayer Unmounted ===`, 'color: red; font-weight: bold');
    };
  }, [groupId, user?.id]);

  // Initialize video player
  useEffect(() => {
    if (!currentMovie?.videoUrl || !videoRef.current) return;

    const videoElement = videoRef.current.querySelector('video');
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    // Clear container and create new video element
    if (videoRef.current) {
      videoRef.current.innerHTML = '';
    }

    const video = document.createElement('video');
    video.className = 'video-js vjs-default-skin';
    video.setAttribute('controls', 'true');
    video.setAttribute('preload', 'auto');
    videoRef.current?.appendChild(video);

    // Initialize player with responsive settings
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

    // Fix video URL - remove any extra protocols
    let videoUrl = currentMovie.videoUrl;
    if (videoUrl && videoUrl.includes('https://https://')) {
      videoUrl = videoUrl.replace('https://https://', 'https://');
    }
    if (videoUrl && !videoUrl.startsWith('http')) {
      videoUrl = `https://${videoUrl}`;
    }

    console.log('Setting video source:', videoUrl);

    // Set source
    player.src({
      src: videoUrl,
      type: 'video/mp4',
    });

    // Handle play event
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

    // Handle pause event
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

    // Handle seek event (debounced)
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
  }, [currentMovie, groupId, updatePlaybackState, hostId, user?.id]);

  // Update movie volume
  useEffect(() => {
    if (playerRef.current) {
      // Convert 0-100 to 0-1 range for video.js
      playerRef.current.volume(movieVolume / 100);
    }
  }, [movieVolume]);

  // Sync playback when receiving updates from other members
  useEffect(() => {
    const handlePlaySync = (data: any) => {
      if (!playerRef.current) return; // Ignore if no player
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
      if (!playerRef.current) return; // Ignore if no player
      const timeDiff = Math.abs(playerRef.current.currentTime() - data.timestamp);
      if (timeDiff > 1) {
        playerRef.current.currentTime(data.timestamp);
      }
      if (!playerRef.current.paused()) {
        playerRef.current.pause();
      }
    };

    const handleSeekSync = (data: any) => {
      if (!playerRef.current) return; // Ignore if no player
      playerRef.current.currentTime(data.timestamp);
    };

    // Handle playback sync request from new members
    const handlePlaybackSyncRequest = async (data: any) => {
      if (user?.id !== hostId) return; // Only host responds
      
      if (playerRef.current) {
        socketClient.emit('playback_sync_response', {
          groupId,
          currentTime: playerRef.current.currentTime(),
          isPlaying: !playerRef.current.paused(),
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Handle sync response for new members
    const handlePlaybackSyncResponse = (data: any) => {
      if (!playerRef.current) return;
      
      // Set the time to match host
      playerRef.current.currentTime(data.currentTime);
      
      // Match playing state
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

  // Handle video call state synchronization across members
  useEffect(() => {
    const handleVideoCallSelfStarted = (data: any) => {
      console.log('You initiated the video call');
      // You started the call, auto-join immediately
      setShowVideoCall(true);
      toast({
        title: 'Video Call Started',
        description: 'Starting your video call...',
      });
    };

    const handleVideoCallInvitation = (data: any) => {
      console.log('Video call invitation received from:', data.initiatorName);
      // Show invitation modal for other members
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

  // Watch party chat event listener
  useEffect(() => {
    if (!groupId) {
      console.warn('Cannot set up message listener: no groupId');
      return;
    }

    console.log(`Setting up watch party message listener for group ${groupId}`);
    
    // Get the current user ID to avoid duplicates
    const currentUserId = user?.id;
    
    const handleReceiveMessage = (data: any) => {
      console.log('Watch party message received from backend:', data);
      
      if (!data || !data.userId) {
        console.warn('Invalid message data received:', data);
        return;
      }

      // Don't add duplicate messages from current user (already added optimistically)
      if (data.userId === currentUserId) {
        console.log('Skipping duplicate message from current user, userId:', currentUserId);
        return;
      }

      console.log('Message is from different user, adding to store');
      const messageObject = {
        userId: data.userId,
        username: data.username || 'Unknown',
        avatar: data.avatar || '',
        message: data.message || '',
        timestamp: data.timestamp || new Date().toISOString(),
      };
      
      console.log('Adding message from other user to store:', messageObject);
      addMessage(messageObject);
    };

    // Ensure socket is connected
    socketClient.connect();
    console.log('Socket connected:', socketClient.isConnected());
    console.log('Socket ID:', socketClient.getSocketId());
    
    socketClient.on('watch_party_receive_message', handleReceiveMessage);

    return () => {
      console.log(`Cleaning up watch party message listener for group ${groupId}`);
      socketClient.off('watch_party_receive_message', handleReceiveMessage);
    };
  }, [groupId, addMessage]);

  // Broadcast video call state changes
  const handleVideoCallToggle = (newState: boolean) => {
    setShowVideoCall(newState);

    if (newState) {
      // Broadcast that this user is starting a video call
      socketClient.emit('video_call_started', {
        groupId,
        initiatedBy: user?.id,
        initiatorName: user?.name || user?.username || 'User',
        initiatorAvatar: user?.avatar,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Broadcast that video call is ending
      socketClient.emit('video_call_ended', {
        groupId,
        initiatedBy: user?.id,
      });
    }
  };

  // Handle video call invitation response
  const handleAcceptVideoCall = () => {
    setShowVideoCall(true);
    setVideoCallInvitation(null);
    
    // Notify others that you joined
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

  const handleSendMessage = (message: string) => {
    if (!message.trim() || !groupId || !user) {
      console.warn('Cannot send message: missing required data');
      return;
    }

    try {
      const messageData = {
        groupId,
        message: message.trim(),
        userId: user.id,
        username: user.username,
        avatar: user.avatar || '',
      };

      // Add message to store immediately (optimistic update)
      addMessage({
        userId: user.id,
        username: user.username,
        avatar: user.avatar || '',
        message: message.trim(),
        timestamp: new Date().toISOString(),
      });

      // Emit to backend to broadcast to other users
      socketClient.emit('watch_party_send_message', messageData);
      console.log('Message sent to watch party:', message);
    } catch (error) {
      console.error('Error sending watch party message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveWatchParty = () => {
    socketClient.emit('leave_watch_party', { groupId });
    
    // If host is leaving, end the watch party
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
    <div className="fixed inset-0 bg-black z-50 flex flex-col h-screen">
      {/* NAVBAR - Fixed Height */}
      <div className="bg-card/90 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h2 className="text-lg font-semibold truncate text-white">{currentMovie.title}</h2>
          {user?.id === hostId && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Host</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant={showVideoCall ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleVideoCallToggle(!showVideoCall)}
            className="gap-2"
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
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT - 100vh - navbar height */}
      <div className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
        
        {/* TOP ROW: Movie, Chat, Group Info - 3 columns */}
        <div className="flex gap-3 flex-1 min-h-0">
          
          {/* MOVIE COLUMN */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            {/* Video Player */}
            <div className="flex-1 bg-black rounded-xl overflow-hidden shadow-lg border border-slate-700 min-h-0">
              <div ref={videoRef} className="w-full h-full" />
            </div>
            
            {/* Movie Volume Control */}
            <div className="flex items-center gap-3 bg-card/60 backdrop-blur rounded-lg border border-border/50 px-4 py-2 flex-shrink-0">
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
              <span className="text-sm font-medium text-white w-8 text-right">{movieVolume}</span>
            </div>
          </div>

          {/* CHATTING COLUMN */}
          <WatchPartyChat onSendMessage={handleSendMessage} />

          {/* GROUP INFO COLUMN - Placeholder */}
          <div className="flex-1 bg-card/40 rounded-xl border border-border/50 overflow-hidden min-w-0">
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">Group Info (coming soon)</p>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Video Call Participants Grid */}
        {showVideoCall && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 border-t border-border/50 pt-3 min-h-0 overflow-hidden"
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

      {/* Video Call Invitation Modal */}
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
