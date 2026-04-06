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
}

export const AgoraVideoCall: React.FC<AgoraVideoCallProps> = ({
  groupId,
  userId,
  onError,
  onParticipantCountChange,
}) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const localCameraTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localMicrophoneTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const remoteVideosRef = useRef<Map<string, ParticipantVideo>>(new Map());

  const [isInitialized, setIsInitialized] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const remoteVideoContainersRef = useRef<HTMLDivElement>(null);

  // Update participant count
  const updateParticipantCount = useCallback(() => {
    const count = remoteVideosRef.current.size + 1; // +1 for local user
    onParticipantCountChange?.(count);
  }, [onParticipantCountChange]);

  // Render remote videos
  const renderRemoteVideos = useCallback(() => {
    if (!remoteVideoContainersRef.current) return;

    const container = remoteVideoContainersRef.current;
    container.innerHTML = '';

    remoteVideosRef.current.forEach((participant) => {
      const videoDiv = document.createElement('div');
      videoDiv.className =
        'relative w-32 h-24 bg-black rounded-lg overflow-hidden flex-shrink-0';
      videoDiv.id = `remote-video-${participant.userId}`;

      // Add user label
      const label = document.createElement('div');
      label.className =
        'absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1';
      label.textContent = `User ${participant.userId.slice(0, 4)}`;
      videoDiv.appendChild(label);

      container.appendChild(videoDiv);

      // Play video track
      if (participant.videoTrack) {
        participant.videoTrack.play(videoDiv);
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
        console.log('Agora token received:', { appId, channelId, uid });

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
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };

    initializeAgora();

    return () => {
      cleanupAgora();
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
    } catch (error) {
      console.error('Error leaving video call:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-slate-900 rounded-lg p-4 w-full">
      {/* Controls */}
      <div className="flex gap-2 justify-center items-center">
        <button
          onClick={toggleCamera}
          disabled={!isInitialized}
          className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isCameraOn
              ? 'bg-green-600 hover:bg-green-700'
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
              ? 'bg-green-600 hover:bg-green-700'
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

        <span className="text-white text-sm font-medium ml-4">
          {remoteVideosRef.current.size + 1} in call
        </span>
      </div>

      {/* Video Container - Always render */}
      <div className="flex flex-col gap-2 w-full">
        {/* Local video */}
        <div className="flex flex-col gap-2 w-full">
          <div className="relative w-full rounded-lg overflow-hidden bg-black flex items-center justify-center"
            style={{ minHeight: '240px', height: '240px' }}
          >
            <div
              ref={localVideoRef}
              className="w-full h-full absolute inset-0"
            />
            
            {/* Loading overlay */}
            {!isInitialized && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <p className="text-white text-sm">Initializing video...</p>
                </div>
              </div>
            )}
          </div>
          <p className="text-white text-xs text-center font-medium">You</p>
        </div>

        {/* Remote videos */}
        {remoteVideosRef.current.size > 0 && (
          <div className="flex gap-2 overflow-x-auto py-2 w-full">
            <div
              ref={remoteVideoContainersRef}
              className="flex gap-2 flex-nowrap"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgoraVideoCall;
