import api from './api';
import { User } from '@/types';
import { currentUser } from '@/data/mockData';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Mock delay to simulate API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Mock implementation - replace with actual API call
    await delay(1000);
    return {
      user: currentUser,
      token: 'mock_jwt_token_123',
    };
    // return api.post('/auth/login', credentials);
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    await delay(1000);
    return {
      user: { ...currentUser, username: data.username, email: data.email },
      token: 'mock_jwt_token_123',
    };
    // return api.post('/auth/register', data);
  },

  async logout(): Promise<void> {
    await delay(500);
    localStorage.removeItem('auth_token');
    // return api.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    await delay(500);
    return currentUser;
    // return api.get('/auth/me');
  },

  async oauthLogin(provider: 'google' | 'github' | 'discord'): Promise<void> {
    // Redirect to OAuth provider
    window.location.href = `/api/auth/${provider}`;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    await delay(800);
    return { ...currentUser, ...data };
    // return api.patch('/auth/profile', data);
  },

  async uploadAvatar(file: File): Promise<string> {
    await delay(1000);
    return URL.createObjectURL(file);
    // const formData = new FormData();
    // formData.append('avatar', file);
    // return api.post('/auth/avatar', formData);
  },
};
