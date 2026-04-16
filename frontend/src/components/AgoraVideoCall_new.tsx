import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng';
import { Mic, MicOff, Video, VideoOff, LogOut } from 'lucide-react';
import { groupService } from '@/services/groupService';

// Disable Agora SDK logging
AgoraRTC.setLogLevel(0); // 0 = NONE, 1 = DEBUG, 2 = INFO, 3 = WARNING, 4 = ERROR
AgoraRTC.disableLogUpload();

interface ParticipantVideo {
  userId: string;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
}

interface AgoraVideoCallProps {
  groupId: string;
  userId: string;
  onError?: (error: string) => void;
  onParticipantCountChange?: (count: number) => void;
  onCallEnded?: () => void;
}

export const AgoraVideoCall: React.FC<AgoraVideoCallProps> = ({
  groupId,
  userId,
  onError,
  onParticipantCountChange,
  onCallEnded,
}) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const localCameraTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localMicrophoneTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const remoteVideosRef = useRef<Map<string, ParticipantVideo>>(new Map());
  const remoteVideoContainersRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
  const [vcVolume, setVcVolume] = useState(100);
  const [participantCount, setParticipantCount] = useState(1);

  // Update participant count
  const updateParticipantCount = useCallback(() => {
    const count = remoteVideosRef.current.size + 1;
    setParticipantCount(count);
    onParticipantCountChange?.(count);
  }, [onParticipantCountChange]);

  // Render remote videos with proper grid layout
  const renderRemoteVideos = useCallback(() => {
    if (!remoteVideoContainersRef.current) return;

    const container = remoteVideoContainersRef.current;
    const gridContainer = container.parentElement;
    if (!gridContainer) return;

    // Get total participant count
    const totalParticipants = remoteVideosRef.current.size + 1;

    // Determine grid class based on participant count
    let gridClass = 'w-full h-full grid gap-3';
    if (totalParticipants === 2) {
      gridClass += ' grid-cols-2';
    } else if (totalParticipants === 3) {
      gridClass += ' grid-cols-3';
    } else if (totalParticipants === 4) {
      gridClass += ' grid-cols-2 grid-rows-2';
    } else if (totalParticipants > 4) {
      gridClass += ' grid-cols-3';
    } else {
      gridClass += ' grid-cols-1';
    }

    // Update grid layout
    if (gridContainer.className !== gridClass) {
      gridContainer.className = gridClass;
      console.log('Grid updated for', totalParticipants, 'participants');
    }

    // Remove videos for users who left
    const existingVideos = Array.from(
      container.querySelectorAll('[data-user-id]')
    );
    existingVideos.forEach((video) => {
      const userId = video.getAttribute('data-user-id');
      if (userId && !remoteVideosRef.current.has(userId)) {
        video.remove();
      }
    });

    // Add or update remote videos
    remoteVideosRef.current.forEach((participant) => {
      let videoDiv = container.querySelector(
        `[data-user-id="${participant.userId}"]`
      ) as HTMLElement;

      if (!videoDiv) {
        videoDiv = document.createElement('div');
        videoDiv.setAttribute('data-user-id', participant.userId);
        videoDiv.className =
          'relative bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700 w-full h-full';

        const label = document.createElement('div');
        label.className =
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-10 pointer-events-none';
        label.innerHTML = `<p class="text-white text-xs font-medium">User ${participant.userId.slice(0, 6)}</p>`;
        videoDiv.appendChild(label);

        container.appendChild(videoDiv);
      }

      // Clear old video/canvas elements
      const oldElements = Array.from(videoDiv.querySelectorAll('video, canvas'));
      oldElements.forEach((el) => {
        if (el !== label) el.remove();
      });

      // Play video track
      if (participant.videoTrack) {
        try {
          participant.videoTrack.play(videoDiv);
        } catch (error) {
          console.error('Error playing video:', error);
        }
      }
    });
  }, []);

  // Handle remote user publishing video/audio
  const handleUserPublished = useCallback(
    async (user: any, mediaType: 'video' | 'audio') => {
      try {
        if (clientRef.current) {
          await clientRef.current.subscribe(user, mediaType);
        }

        const uid = user.uid.toString();
        const remoteVideos = remoteVideosRef.current;

        if (!remoteVideos.has(uid)) {
          remoteVideos.set(uid, { userId: uid });
        }

        const participant = remoteVideos.get(uid)!;

        if (mediaType === 'video') {
          participant.videoTrack = user.videoTrack;
        } else if (mediaType === 'audio') {
          participant.audioTrack = user.audioTrack;
          if (
            participant.audioTrack &&
            typeof participant.audioTrack.setVolume === 'function'
          ) {
            participant.audioTrack.setVolume(vcVolume);
          }
        }

        if (participant.audioTrack) {
          participant.audioTrack.play();
        }

        renderRemoteVideos();
        updateParticipantCount();
      } catch (error) {
        console.error('Error subscribing to remote user:', error);
      }
    },
    [renderRemoteVideos, updateParticipantCount, vcVolume]
  );

  // Handle remote user unpublishing
  const handleUserUnpublished = useCallback(
    async (user: any, mediaType: string) => {
      const uid = user.uid.toString();
      const remoteVideos = remoteVideosRef.current;
      const participant = remoteVideos.get(uid);

      if (participant) {
        if (mediaType === 'video') {
          participant.videoTrack = undefined;
        } else if (mediaType === 'audio') {
          participant.audioTrack?.stop();
          participant.audioTrack = undefined;
        }

        if (!participant.videoTrack && !participant.audioTrack) {
          remoteVideos.delete(uid);
        }
      }

      renderRemoteVideos();
      updateParticipantCount();
    },
    [renderRemoteVideos, updateParticipantCount]
  );

  // Handle user joined
  const handleUserJoined = useCallback(
    (user: any) => {
      console.log(`User ${user.uid} joined`);
      updateParticipantCount();
    },
    [updateParticipantCount]
  );

  // Handle user left
  const handleUserLeft = useCallback(
    (user: any) => {
      console.log(`User ${user.uid} left`);
      const uid = user.uid.toString();
      remoteVideosRef.current.delete(uid);
      renderRemoteVideos();
      updateParticipantCount();
    },
    [renderRemoteVideos, updateParticipantCount]
  );

  // Initialize Agora
  useEffect(() => {
    if (initializingRef.current || clientRef.current) return;
    if (!localVideoRef.current) return;

    initializingRef.current = true;

    const initializeAgora = async () => {
      try {
        // Get token from backend
        const response = await groupService.getAgoraToken(groupId, userId);
        const { token, appId, channelId, uid } = response.data;

        console.log('Agora token received, creating client...');

        // Create client
        const client = AgoraRTC.createClient({
          mode: 'rtc',
          codec: 'vp9',
        });

        clientRef.current = client;

        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);
        client.on('user-joined', handleUserJoined);
        client.on('user-left', handleUserLeft);

        // Join channel
        console.log('Joining Agora channel...');
        await client.join(appId, channelId, token, uid);
        console.log('Successfully joined Agora channel');

        // Create local tracks
        const [cameraTrack, microphoneTrack] = await Promise.all([
          AgoraRTC.createCameraVideoTrack({
            encoderConfig: {
              width: { min: 320, ideal: 640, max: 1280 },
              height: { min: 240, ideal: 480, max: 720 },
              frameRate: { ideal: 15, min: 5, max: 30 },
              bitrateMin: 500,
              bitrateMax: 2000,
            },
          }),
          AgoraRTC.createMicrophoneAudioTrack(),
        ]);

        console.log('Tracks created');

        localCameraTrackRef.current = cameraTrack;
        localMicrophoneTrackRef.current = microphoneTrack;

        // Play local video
        let retries = 10;
        while (!localVideoRef.current && retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          retries--;
        }

        if (localVideoRef.current) {
          try {
            await cameraTrack.play(localVideoRef.current);
            console.log('Local video playing');
          } catch (error) {
            console.warn('Local video play error:', error);
          }
        }

        // Publish tracks
        await client.publish([cameraTrack, microphoneTrack]);
        console.log('Tracks published');

        setIsInitialized(true);
      } catch (error: any) {
        console.error('Agora error:', error);
        initializingRef.current = false;
        onError?.(error.message || 'Failed to initialize video call');
      }
    };

    initializeAgora();

    return () => {
      const cleanup = async () => {
        try {
          if (localCameraTrackRef.current) {
            await localCameraTrackRef.current.close();
            localCameraTrackRef.current = null;
          }
          if (localMicrophoneTrackRef.current) {
            await localMicrophoneTrackRef.current.close();
            localMicrophoneTrackRef.current = null;
          }
          if (clientRef.current) {
            await clientRef.current.leave();
            clientRef.current = null;
          }
          setIsInitialized(false);
          initializingRef.current = false;
        } catch (error) {
          console.error('Cleanup error:', error);
          initializingRef.current = false;
        }
      };

      cleanup();
    };
  }, [groupId, userId, onError, handleUserPublished, handleUserUnpublished, handleUserJoined, handleUserLeft]);

  // Toggle camera
  const toggleCamera = async () => {
    try {
      if (localCameraTrackRef.current) {
        await localCameraTrackRef.current.setEnabled(!isCameraOn);
        setIsCameraOn(!isCameraOn);
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    try {
      if (localMicrophoneTrackRef.current) {
        await localMicrophoneTrackRef.current.setEnabled(!isMicrophoneOn);
        setIsMicrophoneOn(!isMicrophoneOn);
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  };

  // Update VC volume
  const updateVcVolume = (volume: number) => {
    setVcVolume(volume);
    remoteVideosRef.current.forEach((participant) => {
      if (
        participant.audioTrack &&
        typeof participant.audioTrack.setVolume === 'function'
      ) {
        participant.audioTrack.setVolume(volume);
      }
    });
  };

  // Leave call
  const leaveCall = async () => {
    try {
      if (localCameraTrackRef.current) {
        localCameraTrackRef.current.close();
        localCameraTrackRef.current = null;
      }
      if (localMicrophoneTrackRef.current) {
        localMicrophoneTrackRef.current.close();
        localMicrophoneTrackRef.current = null;
      }
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
      setIsInitialized(false);
      remoteVideosRef.current.clear();
      setParticipantCount(1);

      if (remoteVideoContainersRef.current) {
        remoteVideoContainersRef.current.innerHTML = '';
      }

      onCallEnded?.();
    } catch (error) {
      console.error('Error leaving video call:', error);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full h-full bg-black rounded-xl overflow-hidden">
      {/* Controls Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700/50 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCamera}
            disabled={!isInitialized}
            className={`p-2 rounded-full transition-colors disabled:opacity-50 ${
              isCameraOn
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isCameraOn ? (
              <Video className="w-5 h-5 text-white" />
            ) : (
              <VideoOff className="w-5 h-5 text-white" />
            )}
          </button>

          <button
            onClick={toggleMicrophone}
            disabled={!isInitialized}
            className={`p-2 rounded-full transition-colors disabled:opacity-50 ${
              isMicrophoneOn
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isMicrophoneOn ? (
              <Mic className="w-5 h-5 text-white" />
            ) : (
              <MicOff className="w-5 h-5 text-white" />
            )}
          </button>

          <button
            onClick={leaveCall}
            disabled={!isInitialized}
            className="p-2 rounded-full bg-red-700 hover:bg-red-800 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>

          <div className="text-white text-sm font-medium">
            {participantCount} in call
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-white text-sm">VC Volume:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={vcVolume}
            onChange={(e) => updateVcVolume(Number(e.target.value))}
            className="w-32 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
          />
          <span className="text-white text-sm w-8 text-right">{vcVolume}</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 overflow-hidden p-3 min-h-0">
        <div className="w-full h-full grid gap-3 grid-cols-1" id="video-grid-container">
          {/* Local Video */}
          <div className="relative bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700 w-full h-full">
            <div ref={localVideoRef} className="w-full h-full" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-10">
              <p className="text-white text-xs font-medium">You</p>
            </div>
            {!isInitialized && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <p className="text-white text-sm">Initializing...</p>
                </div>
              </div>
            )}
          </div>

          {/* Remote Videos Container */}
          <div ref={remoteVideoContainersRef} />
        </div>
      </div>
    </div>
  );
};

export default AgoraVideoCall;
