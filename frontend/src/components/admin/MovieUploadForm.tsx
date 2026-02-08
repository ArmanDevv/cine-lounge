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

const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-matroska'];
const MAX_SIZE_MB = Number(import.meta.env.VITE_MAX_VIDEO_SIZE_MB || 1024);

export default function MovieUploadForm({ onClose, genres }: Props) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const f = e.target.files[0];
    if (!allowedMimes.includes(f.type)) {
      toast({ title: 'Invalid file type', description: 'Only mp4, mov and mkv are allowed', variant: 'destructive' });
      return;
    }

    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Max video size is ${MAX_SIZE_MB} MB`, variant: 'destructive' });
      return;
    }

    setFile(f);
  };

  const handleSubmit = async () => {
    if (!title || !description || selectedGenres.length === 0 || !thumbnailUrl || !file) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields and select a video file', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      // Step 1: request upload url
      const { uploadUrl, fileKey, videoUrl } = await movieUploadService.requestUploadUrl(file);

      // Step 2: upload directly to S3
      await movieUploadService.uploadVideoToS3(uploadUrl, file, (p) => setProgress(p));

      // Step 3: save metadata
      const movieData = {
        title,
        description,
        genre: selectedGenres.join(', '),
        thumbnailUrl,
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
        <Label>Thumbnail URL</Label>
        <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://..." className="mt-2" />
      </div>

      <div>
        <Label>Video File</Label>
        <input type="file" accept="video/mp4,video/quicktime,video/x-matroska" onChange={handleFileChange} className="mt-2" />
        {file && <p className="text-sm mt-1">Selected: {file.name} ({(file.size / (1024*1024)).toFixed(2)} MB)</p>}
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