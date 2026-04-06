import { io, Socket } from 'socket.io-client';

// Socket.io client setup - ready for backend integration
class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private isConnecting: boolean = false;

  connect() {
    if (this.socket?.connected || this.isConnecting) return;

    this.isConnecting = true;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(socketUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      auth: {
        token: localStorage.getItem('auth_token'),
      },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnecting = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnecting = false;
    });
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
  onWatchPartyStart(callback: (data: any) => void) {
    this.socket?.on('watch_party_started', callback);
  }

  onWatchPartyJoin(callback: (data: any) => void) {
    this.socket?.on('watch_party_member_joined', callback);
  }

  onWatchPartyLeave(callback: (data: any) => void) {
    this.socket?.on('watch_party_member_left', callback);
  }

  onWatchPartyPlaySync(callback: (data: any) => void) {
    this.socket?.on('watch_party_play', callback);
  }

  onWatchPartyPauseSync(callback: (data: any) => void) {
    this.socket?.on('watch_party_pause', callback);
  }

  onWatchPartySeekSync(callback: (data: any) => void) {
    this.socket?.on('watch_party_seek', callback);
  }

  onWatchPartyEnd(callback: () => void) {
    this.socket?.on('watch_party_ended', callback);
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
