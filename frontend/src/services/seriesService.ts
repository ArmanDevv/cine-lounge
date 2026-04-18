import api from './api';
import axios from 'axios';
import { Series, Season, Episode } from '@/types';

export async function getAllSeries(): Promise<Series[]> {
  const response = await api.get<Series[]>('/series');
  return response.data;
}

export async function getSeriesById(id: string): Promise<Series> {
  const response = await api.get<Series>(`/series/${id}`);
  return response.data;
}

export async function createSeries(seriesData: {
  title: string;
  description: string;
  genre: string;
  thumbnailUrl: string;
  seasons: Season[];
}): Promise<Series> {
  const response = await api.post<Series>('/series', seriesData);
  return response.data;
}

export async function updateSeries(
  id: string,
  seriesData: Partial<{
    title: string;
    description: string;
    genre: string;
    thumbnailUrl: string;
    seasons: Season[];
  }>
): Promise<Series> {
  const response = await api.put<Series>(`/series/${id}`, seriesData);
  return response.data;
}

export async function deleteSeries(id: string): Promise<void> {
  await api.delete(`/series/${id}`);
}

export interface ThumbnailUploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  thumbnailUrl: string;
}

export interface VideoUploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  videoUrl: string;
}

export async function requestThumbnailUploadUrl(file: File): Promise<ThumbnailUploadUrlResponse> {
  const response = await api.post<ThumbnailUploadUrlResponse>('/admin/generate-thumbnail-upload-url', {
    fileName: file.name,
    fileType: file.type,
  });
  return response.data;
}

export async function requestVideoUploadUrl(file: File): Promise<VideoUploadUrlResponse> {
  const response = await api.post<VideoUploadUrlResponse>('/admin/generate-upload-url', {
    fileName: file.name,
    fileType: file.type,
  });
  return response.data;
}

export async function uploadToS3(uploadUrl: string, file: File, onProgress?: (percent: number) => void): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
    onUploadProgress: (progressEvent) => {
      if (!progressEvent.total) return;
      const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      if (onProgress) onProgress(percent);
    },
  });
}

export default {
  getAllSeries,
  getSeriesById,
  createSeries,
  updateSeries,
  deleteSeries,
  requestThumbnailUploadUrl,
  requestVideoUploadUrl,
  uploadToS3,
};
