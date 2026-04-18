import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import * as movieUploadService from '@/services/movieUploadService';

interface Props {
  onClose: () => void;
  genres: string[];
}

const allowedVideoMimes = ['video/mp4', 'video/quicktime', 'video/x-matroska'];
const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_VIDEO_SIZE_MB = Number(import.meta.env.VITE_MAX_VIDEO_SIZE_MB || 1024);
const MAX_THUMBNAIL_SIZE_MB = 50; // 50MB max for thumbnail

export default function MovieUploadForm({ onClose, genres }: Props) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [thumbnailMode, setThumbnailMode] = useState<'url' | 'file'>('url'); // 'url' or 'file'
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]));
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const f = e.target.files[0];
    if (!allowedVideoMimes.includes(f.type)) {
      toast({ title: 'Invalid file type', description: 'Only mp4, mov and mkv are allowed', variant: 'destructive' });
      return;
    }
    
    if (f.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Max video size is ${MAX_VIDEO_SIZE_MB} MB`, variant: 'destructive' });
      return;
    }

    setVideoFile(f);
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const f = e.target.files[0];
    if (!allowedImageMimes.includes(f.type)) {
      toast({ title: 'Invalid file type', description: 'Only JPEG, PNG, WebP and GIF are allowed', variant: 'destructive' });
      return;
    }
    
    if (f.size > MAX_THUMBNAIL_SIZE_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Max thumbnail size is ${MAX_THUMBNAIL_SIZE_MB} MB`, variant: 'destructive' });
      return;
    }

    setThumbnailFile(f);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!title || !description || selectedGenres.length === 0 || !videoFile) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields and select a video file', variant: 'destructive' });
      return;
    }

    // Validate thumbnail (either URL or file must be provided)
    if (thumbnailMode === 'url' && !thumbnailUrl) {
      toast({ title: 'Missing thumbnail', description: 'Please provide a thumbnail URL', variant: 'destructive' });
      return;
    }

    if (thumbnailMode === 'file' && !thumbnailFile) {
      toast({ title: 'Missing thumbnail', description: 'Please select a thumbnail file', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      let finalThumbnailUrl = thumbnailUrl;

      // If thumbnail is a file, upload it first
      if (thumbnailMode === 'file' && thumbnailFile) {
        try {
          const { uploadUrl: thumbnailUploadUrl, thumbnailUrl: uploadedThumbnailUrl } = 
            await movieUploadService.requestThumbnailUploadUrl(thumbnailFile);
          
          await movieUploadService.uploadThumbnailToS3(thumbnailUploadUrl, thumbnailFile, (p) => {
            setProgress(Math.round(p * 0.3)); // 0-30% for thumbnail
          });

          finalThumbnailUrl = uploadedThumbnailUrl;
        } catch (err: any) {
          throw new Error(`Thumbnail upload failed: ${err?.response?.data?.message || err.message}`);
        }
      }

      // Step 1: request video upload url
      const { uploadUrl, fileKey, videoUrl } = await movieUploadService.requestUploadUrl(videoFile);

      // Step 2: upload video directly to S3
      await movieUploadService.uploadVideoToS3(uploadUrl, videoFile, (p) => {
        if (thumbnailMode === 'file') {
          setProgress(30 + Math.round(p * 0.7)); // 30-100% for video
        } else {
          setProgress(p); // 0-100% for video only
        }
      });

      // Step 3: save metadata
      const movieData = {
        title,
        description,
        genre: selectedGenres.join(', '),
        thumbnailUrl: finalThumbnailUrl,
        videoUrl,
      };

      await movieUploadService.saveMovieMetadata(movieData);

      toast({ title: 'Upload successful', description: 'Movie uploaded and saved', variant: 'default' });
      onClose();
    } catch (err: any) {
      console.error('Upload error', err);
      toast({ title: 'Upload failed', description: err?.response?.data?.message || err.message || 'An error occurred', variant: 'destructive' });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Movie title" className="mt-2" />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Movie description..." className="mt-2" rows={4} />
      </div>
      
      <div>
        <Label>Genres</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {genres.map((g) => (
            <Badge key={g} variant={selectedGenres.includes(g) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleGenre(g)}>
              {g}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <Label>Thumbnail</Label>
        <div className="flex gap-2 mt-2 mb-3">
          <Button 
            type="button"
            variant={thumbnailMode === 'url' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => {
              setThumbnailMode('url');
              setThumbnailFile(null);
            }}
          >
            URL
          </Button>
          <Button 
            type="button"
            variant={thumbnailMode === 'file' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => {
              setThumbnailMode('file');
              setThumbnailUrl('');
            }}
          >
            Upload File
          </Button>
        </div>

        {thumbnailMode === 'url' ? (
          <Input 
            value={thumbnailUrl} 
            onChange={(e) => setThumbnailUrl(e.target.value)} 
            placeholder="https://example.com/image.jpg" 
            className="mt-2" 
          />
        ) : (
          <>
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp,image/gif" 
              onChange={handleThumbnailFileChange} 
              className="mt-2" 
            />
            {thumbnailFile && (
              <p className="text-sm mt-1">Selected: {thumbnailFile.name} ({(thumbnailFile.size / (1024*1024)).toFixed(2)} MB)</p>
            )}
          </>
        )}
      </div>

      <div>
        <Label>Video File</Label>
        <input type="file" accept="video/mp4,video/quicktime,video/x-matroska" onChange={handleVideoFileChange} className="mt-2" />
        {videoFile && <p className="text-sm mt-1">Selected: {videoFile.name} ({(videoFile.size / (1024*1024)).toFixed(2)} MB)</p>}
      </div>

      {uploading && (
        <div>
          <Label>Uploading</Label>
          <div className="w-full bg-secondary/30 rounded h-2 mt-2">
            <div className="bg-primary h-2 rounded" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm mt-1">{progress}%</p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button className="flex-1 btn-cinema" onClick={handleSubmit} disabled={uploading}>
          {uploading ? `Uploading (${progress}%)` : 'Add Movie'}
        </Button>
      </div>
    </div>
  );
}