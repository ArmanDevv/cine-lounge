import { io, Socket } from 'socket.io-client';

// Socket.io client setup - ready for backend integration
class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('auth_token'),
      },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Mock connection for demo purposes
    // this.socket.connect();
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  // Chat events
  joinRoom(roomId: string) {
    this.socket?.emit('join_room', { roomId });
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave_room', { roomId });
  }

  sendMessage(roomId: string, message: string) {
    this.socket?.emit('send_message', { roomId, message });
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('new_message', callback);
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.on('user_typing', callback);
  }

  emitTyping(roomId: string, isTyping: boolean) {
    this.socket?.emit('typing', { roomId, isTyping });
  }

  // Watch party events
  joinWatchParty(partyId: string) {
    this.socket?.emit('join_watch_party', { partyId });
  }

  leaveWatchParty(partyId: string) {
    this.socket?.emit('leave_watch_party', { partyId });
  }

  syncPlayback(partyId: string, currentTime: number, isPlaying: boolean) {
    this.socket?.emit('sync_playback', { partyId, currentTime, isPlaying });
  }

  onPlaybackSync(callback: (data: { currentTime: number; isPlaying: boolean }) => void) {
    this.socket?.on('playback_sync', callback);
  }

  onParticipantJoined(callback: (user: any) => void) {
    this.socket?.on('participant_joined', callback);
  }

  onParticipantLeft(callback: (userId: string) => void) {
    this.socket?.on('participant_left', callback);
  }

  // User presence
  onUserOnline(callback: (userId: string) => void) {
    this.socket?.on('user_online', callback);
  }

  onUserOffline(callback: (userId: string) => void) {
    this.socket?.on('user_offline', callback);
  }

  // Video call events
  joinVideoCall(roomId: string) {
    this.socket?.emit('join_video_call', { roomId });
  }

  leaveVideoCall(roomId: string) {
    this.socket?.emit('leave_video_call', { roomId });
  }

  onVideoCallParticipants(callback: (participants: any[]) => void) {
    this.socket?.on('video_call_participants', callback);
  }

  // Generic event handlers
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
      this.listeners.get(event)?.delete(callback);
    } else {
      this.socket?.off(event);
      this.listeners.delete(event);
    }
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }
}

export const socketClient = new SocketClient();
