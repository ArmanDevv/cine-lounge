import api from './api';
import axios from 'axios';

export interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  videoUrl: string;
}

export async function requestUploadUrl(file: File): Promise<UploadUrlResponse> {
  const response = await api.post<UploadUrlResponse>('/admin/generate-upload-url', {
    fileName: file.name,
    fileType: file.type,
  });
  return response.data;
}

export async function uploadVideoToS3(uploadUrl: string, file: File, onProgress?: (percent: number) => void) {
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

export async function saveMovieMetadata(movieData: any) {
  const response = await api.post('/admin/movies', movieData);
  return response.data;
}

export default { requestUploadUrl, uploadVideoToS3, saveMovieMetadata };