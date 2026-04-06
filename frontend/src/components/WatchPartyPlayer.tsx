import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Pause, Users, LogOut, Video, VideoOff } from 'lucide-react';
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
  const [showMembersSidebar, setShowMembersSidebar] = useState(true);
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
    updatePlaybackState,
  } = useWatchPartyStore();

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
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur border-b border-border p-3 md:p-4 flex items-center justify-between flex-wrap gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <h2 className="text-base md:text-lg font-semibold truncate">{currentMovie.title}</h2>
          <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
            {user?.id === hostId && '(Host)'}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant={showVideoCall ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleVideoCallToggle(!showVideoCall)}
            className="gap-2 text-xs md:text-sm"
          >
            {showVideoCall ? (
              <>
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Video ({participantCount})</span>
                <span className="sm:hidden">VC</span>
              </>
            ) : (
              <>
                <VideoOff className="w-4 h-4" />
                <span className="hidden sm:inline">Start Video</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMembersSidebar(!showMembersSidebar)}
            className="md:hidden gap-2 text-xs"
          >
            <Users className="w-4 h-4" />
            <span>Team</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveWatchParty}
            className="text-red-500 hover:text-red-600 text-xs md:text-sm"
          >
            <LogOut className="w-4 h-4 md:mr-2" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content - Responsive Layout with proper overflow handling */}
      <div className="flex flex-1 gap-2 md:gap-3 p-2 md:p-3 w-full min-h-0 overflow-hidden flex-col md:flex-row">
        {/* Left Column - Video Player and Video Call */}
        <div className="flex-1 flex flex-col gap-2 md:gap-3 min-h-0 min-w-0 order-1 md:order-1 overflow-hidden">
          {/* Video Player - Fills remaining space or shrinks when VC is active */}
          <div 
            className="relative w-full bg-black rounded-lg overflow-hidden min-w-0 flex-shrink-0"
            style={{
              height: showVideoCall ? '180px' : '100%',
              flexBasis: showVideoCall ? 'auto' : '0',
              minHeight: '180px',
            }}
          >
            <div ref={videoRef} className="w-full h-full bg-black" />
          </div>

          {/* Agora Video Call - Fixed height when visible */}
          {showVideoCall && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full overflow-hidden rounded-lg border border-border flex-shrink-0"
              style={{ height: '200px' }}
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

          {/* Members Sidebar - Mobile Bottom (only show if not too crowded) */}
          {showMembersSidebar && !showVideoCall && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden w-full bg-card/50 backdrop-blur rounded-lg border border-border p-3 overflow-y-auto flex-shrink-0"
              style={{ maxHeight: '120px' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Members ({members.length})</h3>
              </div>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-2 p-2 rounded bg-secondary/50 text-sm"
                  >
                    <img
                      src={member.avatar}
                      alt={member.username}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs truncate">{member.username}</p>
                      {member.isHost && (
                        <p className="text-xs text-primary">Host</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Members Sidebar - Desktop Right (Fixed width, scrollable) */}
        {showMembersSidebar && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex flex-col gap-3 bg-card/50 backdrop-blur rounded-lg border border-border p-4 min-h-0 flex-shrink-0 overflow-hidden"
            style={{ width: '280px' }}
          >
            <div className="flex items-center gap-2 flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">Watching ({members.length})</h3>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
              {members.map((member) => (
                <motion.div
                  key={member.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors flex-shrink-0"
                >
                  <img
                    src={member.avatar}
                    alt={member.username}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{member.username}</p>
                    {member.isHost && (
                      <p className="text-xs text-primary">Host</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-3 border-t border-border text-xs text-muted-foreground flex-shrink-0">
              <p>✨ All members synchronized</p>
            </div>
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
