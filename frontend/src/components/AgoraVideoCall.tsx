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
  const initializingRef = useRef(false); // Prevent multiple initializations

  const [isInitialized, setIsInitialized] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
  const [vcVolume, setVcVolume] = useState(100); // Video call volume (0-100)
  const [participants, setParticipants] = useState<string[]>([]);
  const remoteVideoContainersRef = useRef<HTMLDivElement>(null);

  // Update participant count
  const updateParticipantCount = useCallback(() => {
    const count = remoteVideosRef.current.size + 1; // +1 for local user
    onParticipantCountChange?.(count);
  }, [onParticipantCountChange]);

  // Render remote videos with proper grid layout
  const renderRemoteVideos = useCallback(() => {
    if (!remoteVideoContainersRef.current) return;

    const container = remoteVideoContainersRef.current;

    // Remove videos for users who left
    const existingVideos = container.querySelectorAll('[id^="remote-video-"]');
    existingVideos.forEach(video => {
      const userId = video.id.replace('remote-video-', '');
      if (!remoteVideosRef.current.has(userId)) {
        video.remove();
      }
    });

    // Add or update remote videos
    remoteVideosRef.current.forEach((participant) => {
      let videoDiv = container.querySelector(`#remote-video-${participant.userId}`) as HTMLElement;
      
      if (!videoDiv) {
        videoDiv = document.createElement('div');
        videoDiv.id = `remote-video-${participant.userId}`;
        videoDiv.className = 'relative bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700';
        videoDiv.style.width = '400px';
        videoDiv.style.height = '400px';
        
        const label = document.createElement('div');
        label.className = 'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 z-10';
        label.innerHTML = `<p class="text-white text-xs font-medium">User ${participant.userId.slice(0, 6)}</p>`;
        videoDiv.appendChild(label);
        
        container.appendChild(videoDiv);
        console.log('Created new video div for:', participant.userId);
      }

      if (participant.videoTrack) {
        // Clear old canvas/video elements
        const oldElements = videoDiv.querySelectorAll('video, canvas');
        oldElements.forEach(el => {
          if (el?.parentElement === videoDiv) el.remove();
        });

        try {
          participant.videoTrack.play(videoDiv);
          console.log('Playing video for:', participant.userId);
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
        // Subscribe to the remote stream
        if (clientRef.current) {
          await clientRef.current.subscribe(user, mediaType);
        }

        // Update remote videos
        const remoteVideos = remoteVideosRef.current;
        const uid = user.uid.toString();

        if (!remoteVideos.has(uid)) {
          remoteVideos.set(uid, { userId: uid });
        }

        const participant = remoteVideos.get(uid)!;

        if (mediaType === 'video') {
          participant.videoTrack = user.videoTrack;
        } else if (mediaType === 'audio') {
          participant.audioTrack = user.audioTrack;
          // Apply current VC volume to newly added audio track
          if (participant.audioTrack && typeof participant.audioTrack.setVolume === 'function') {
            participant.audioTrack.setVolume(vcVolume);
          }
        }

        // Play audio track
        if (participant.audioTrack) {
          participant.audioTrack.play();
        }

        renderRemoteVideos();
        updateParticipantCount();
      } catch (error) {
        console.error('Error subscribing to remote user:', error);
      }
    },
    [renderRemoteVideos, updateParticipantCount]
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

  // Handle user joined event
  const handleUserJoined = useCallback(
    (user: any) => {
      console.log(`User ${user.uid} joined the channel`);
      updateParticipantCount();
    },
    [updateParticipantCount]
  );

  // Handle user left event
  const handleUserLeft = useCallback(
    (user: any) => {
      const uid = user.uid.toString();
      remoteVideosRef.current.delete(uid);
      renderRemoteVideos();
      updateParticipantCount();
    },
    [renderRemoteVideos, updateParticipantCount]
  );

  // Initialize Agora
  useEffect(() => {
    const initializeAgora = async () => {
      // Guard: Prevent multiple initializations
      if (initializingRef.current || clientRef.current) {
        console.log('Agora already initializing or initialized, skipping...');
        return;
      }

      initializingRef.current = true;

      try {
        // Request camera and microphone permissions explicitly
        console.log('Requesting camera and microphone permissions...');
        try {
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          console.log('Permissions granted!');
        } catch (permError: any) {
          console.error('Permission denied:', permError);
          throw new Error(
            `Camera/microphone permission denied: ${permError.message}. Please check your browser settings.`
          );
        }

        // Fetch Agora token from backend using groupService
        const { token, appId, channelId, uid } = await groupService.getAgoraToken(groupId);
        console.log('Agora token received:', { appId, channelId, uid, userId });

        // Create Agora client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp9' });
        clientRef.current = client;

        console.log('Creating Agora client and joining channel...');

        // Set up event listeners
        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);
        client.on('user-joined', handleUserJoined);
        client.on('user-left', handleUserLeft);

        // Join channel with proper UID from backend
        console.log('Joining Agora channel with UID:', uid);
        await client.join(appId, channelId, token, uid);
        console.log('Successfully joined Agora channel with UID:', uid);

        // Create and publish local tracks
        console.log('Creating camera and microphone tracks...');
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

        console.log('Tracks created successfully');

        // Wait for ref to be available with retry logic
        let refReady = false;
        let retries = 10;
        while (!refReady && retries > 0) {
          if (localVideoRef.current) {
            refReady = true;
            console.log('Local video ref is ready');
          } else {
            console.log(`Waiting for ref... retries left: ${retries}`);
            await new Promise(resolve => setTimeout(resolve, 50)); // Wait 50ms
            retries--;
          }
        }

        if (!refReady) {
          console.error('Local video ref not available after retries! Aborting track playback.');
          throw new Error('Video container not initialized');
        }

        // Store references
        localCameraTrackRef.current = cameraTrack;
        localMicrophoneTrackRef.current = microphoneTrack;

        // Play local video with error handling
        console.log('Attempting to play local camera track...');
        try {
          await cameraTrack.play(localVideoRef.current);
          console.log('Camera track played successfully');
        } catch (playError: any) {
          console.error('Error playing camera track:', playError);
          // Don't throw, continue even if play fails - it might work with publish
          console.warn('Continuing despite play error...');
        }

        // Publish tracks
        console.log('Publishing tracks to Agora...');
        await client.publish([cameraTrack, microphoneTrack]);
        console.log('Tracks published successfully');

        // Only set initialized after successful publication
        setIsInitialized(true);
      } catch (error: any) {
        const errorMessage =
          error.message || 'Failed to initialize video conferencing';
        console.error('Agora initialization error:', error);
        initializingRef.current = false; // Reset flag on error
        onError?.(errorMessage);
      }
    };

    const cleanupAgora = async () => {
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
        initializingRef.current = false; // Reset flag on cleanup
        setIsInitialized(false);
      } catch (error) {
        console.error('Error during cleanup:', error);
        initializingRef.current = false;
      }
    };

    initializeAgora();

    return () => {
      cleanupAgora();
    };
  }, [groupId, userId]); // Only depend on actual external dependencies

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

  // Update video call volume
  const updateVcVolume = (volume: number) => {
    setVcVolume(volume);
    // Apply volume to all remote audio tracks
    remoteVideosRef.current.forEach((participant) => {
      if (participant.audioTrack && typeof participant.audioTrack.setVolume === 'function') {
        participant.audioTrack.setVolume(volume);
      }
    });
  };

  // Leave video call
  const leaveCall = async () => {
    try {
      // Unpublish and close local tracks
      if (localCameraTrackRef.current) {
        localCameraTrackRef.current.close();
        localCameraTrackRef.current = null;
      }
      if (localMicrophoneTrackRef.current) {
        localMicrophoneTrackRef.current.close();
        localMicrophoneTrackRef.current = null;
      }

      // Leave channel
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }

      setIsInitialized(false);
      remoteVideosRef.current.clear();
      setParticipants([]);

      if (remoteVideoContainersRef.current) {
        remoteVideoContainersRef.current.innerHTML = '';
      }

      // Notify parent that call ended
      onCallEnded?.();
    } catch (error) {
      console.error('Error leaving video call:', error);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full h-full bg-black rounded-xl overflow-hidden">
      {/* Controls Bar - Professional Design */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleCamera}
            disabled={!isInitialized}
            className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isCameraOn
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
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
            className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isMicrophoneOn
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
            title={isMicrophoneOn ? 'Mute' : 'Unmute'}
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
            className="p-2 rounded-full bg-red-700 hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Leave video call"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>

          <div className="text-white text-sm font-medium">
            {remoteVideosRef.current.size + 1} in call
          </div>
        </div>

        {/* VC Volume Control - Right Side */}
        <div className="flex items-center gap-3">
          <label className="text-white text-sm whitespace-nowrap">VC Volume:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={vcVolume}
            onChange={(e) => updateVcVolume(Number(e.target.value))}
            className="w-32 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
            title="Video call volume"
          />
          <span className="text-white text-sm font-medium w-10 text-right">{vcVolume}</span>
        </div>
      </div>

      {/* Video Grid Container - Fixed Square Size */}
      <div className="flex-1 overflow-hidden p-3 min-h-0 flex items-center justify-center">
        <div className="flex flex-wrap gap-3 justify-center items-start content-start" id="video-grid-container">
          {/* Local Video */}
          <div className="relative bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700" style={{ width: '400px', height: '400px' }}>
            <div
              ref={localVideoRef}
              className="w-full h-full"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-xs font-medium">You</p>
            </div>

            {/* Loading overlay */}
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
          <div
            ref={remoteVideoContainersRef}
            className="contents"
          />
        </div>
      </div>
    </div>
  );
};

export default AgoraVideoCall;
