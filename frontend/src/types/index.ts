// Core types for CineVerse movie streaming platform

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio?: string;
  role: 'user' | 'admin' | 'moderator';
  isOnline: boolean;
  createdAt: string;
}

export interface Movie {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  poster?: string;
  backdrop?: string;
  thumbnail?: string;
  thumbnailUrl?: string;
  trailer?: string;
  videoUrl?: string;
  genre: string; // API returns genre as string (e.g., "Sci-Fi, Action")
  year?: number;
  duration?: number; // in minutes
  rating?: number;
  cast?: CastMember[];
  director?: string;
  views?: number;
  featured?: boolean;
  uploadedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CastMember {
  id: string;
  name: string;
  character: string;
  avatar: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover?: string;
  movies: Movie[];
  ownerId: string;
  isPublic: boolean;
  isCollaborative: boolean;
  members?: User[];
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar: string;
  cover?: string;
  ownerId: string;
  members: GroupMember[];
  inviteCode: string;
  createdAt: string;
}

export interface GroupMember {
  user: User;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  sender: User;
  groupId: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachmentUrl?: string;
}

export interface WatchParty {
  id: string;
  groupId: string;
  movieId: string;
  movie: Movie;
  hostId: string;
  host: User;
  participants: User[];
  currentTime: number;
  isPlaying: boolean;
  startedAt: string;
}

export interface ScheduledWatch {
  id: string;
  groupId: string;
  movieId: string;
  movie: Movie;
  scheduledAt: string;
  createdBy: User;
  rsvpUsers: User[];
}

export interface Comment {
  id: string;
  movieId: string;
  userId: string;
  user: User;
  content: string;
  rating: number;
  createdAt: string;
}

export interface WatchHistory {
  id: string;
  userId: string;
  movieId: string;
  movie: Movie;
  progress: number; // percentage
  lastWatched: string;
}

export interface AdminStats {
  totalUsers: number;
  totalMovies: number;
  totalViews: number;
  totalGroups: number;
  activeWatchParties: number;
  newUsersToday: number;
  viewsToday: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filter types
export interface MovieFilters {
  genre?: string;
  year?: number;
  minRating?: number;
  search?: string;
  sortBy?: 'trending' | 'newest' | 'popular' | 'rating';
}
