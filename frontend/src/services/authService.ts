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
    console.log('Making login API call to:', api.defaults.baseURL + '/auth/login');
    const response = await api.post('/auth/login', credentials);
    console.log('Login response:', response);
    return response.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('Making register API call to:', api.defaults.baseURL + '/auth/register');
    const response = await api.post('/auth/register', data);
    console.log('Register response:', response);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
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
