import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import * as seriesService from '@/services/seriesService';
import { Season, Episode } from '@/types';

interface Props {
  onClose: () => void;
  genres: string[];
}

const allowedVideoMimes = ['video/mp4', 'video/quicktime', 'video/x-matroska'];
const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_VIDEO_SIZE_MB = Number(import.meta.env.VITE_MAX_VIDEO_SIZE_MB || 1024);
const MAX_THUMBNAIL_SIZE_MB = 50;

export default function SeriesUploadForm({ onClose, genres }: Props) {
  const { toast } = useToast();
  
  // Series basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [thumbnailMode, setThumbnailMode] = useState<'url' | 'file'>('url');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // Seasons and episodes
  const [seasons, setSeasons] = useState<Array<Season & { expanded?: boolean }>>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) => (prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]));
  };

  const toggleSeason = (seasonNum: number) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonNum)) {
      newExpanded.delete(seasonNum);
    } else {
      newExpanded.add(seasonNum);
    }
    setExpandedSeasons(newExpanded);
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

  const addSeason = () => {
    const newSeasonNum = seasons.length + 1;
    setSeasons([...seasons, {
      seasonNumber: newSeasonNum,
      title: `Season ${newSeasonNum}`,
      description: '',
      episodes: [],
      expanded: true,
    }]);
    setExpandedSeasons(new Set(expandedSeasons).add(newSeasonNum));
  };

  const updateSeason = (seasonIndex: number, field: string, value: any) => {
    const newSeasons = [...seasons];
    (newSeasons[seasonIndex] as any)[field] = value;
    setSeasons(newSeasons);
  };

  const removeSeason = (seasonIndex: number) => {
    const newSeasons = seasons.filter((_, i) => i !== seasonIndex);
    setSeasons(newSeasons);
  };

  const addEpisode = (seasonIndex: number) => {
    const newSeasons = [...seasons];
    const nextEpisodeNum = newSeasons[seasonIndex].episodes.length + 1;
    newSeasons[seasonIndex].episodes.push({
      episodeNumber: nextEpisodeNum,
      title: `Episode ${nextEpisodeNum}`,
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      videoMode: 'url' as 'url' | 'file',
      thumbnailMode: 'url' as 'url' | 'file',
    } as any);
    setSeasons(newSeasons);
  };

  const updateEpisode = (seasonIndex: number, episodeIndex: number, field: string, value: any) => {
    const newSeasons = [...seasons];
    (newSeasons[seasonIndex].episodes[episodeIndex] as any)[field] = value;
    setSeasons(newSeasons);
  };

  const removeEpisode = (seasonIndex: number, episodeIndex: number) => {
    const newSeasons = [...seasons];
    newSeasons[seasonIndex].episodes = newSeasons[seasonIndex].episodes.filter((_, i) => i !== episodeIndex);
    setSeasons(newSeasons);
  };

  const handleEpisodeVideoFileChange = (seasonIndex: number, episodeIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
    updateEpisode(seasonIndex, episodeIndex, 'videoFile', f);
  };

  const handleEpisodeThumbFileChange = (seasonIndex: number, episodeIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
    updateEpisode(seasonIndex, episodeIndex, 'thumbnailFile', f);
  };

  const handleSubmit = async () => {
    // Validation
    if (!title || !description || selectedGenres.length === 0) {
      toast({ title: 'Missing fields', description: 'Please fill all required series fields', variant: 'destructive' });
      return;
    }

    if (thumbnailMode === 'url' && !thumbnailUrl) {
      toast({ title: 'Missing thumbnail', description: 'Please provide a thumbnail URL', variant: 'destructive' });
      return;
    }

    if (thumbnailMode === 'file' && !thumbnailFile) {
      toast({ title: 'Missing thumbnail', description: 'Please select a thumbnail file', variant: 'destructive' });
      return;
    }

    if (seasons.length === 0) {
      toast({ title: 'No seasons', description: 'Please add at least one season', variant: 'destructive' });
      return;
    }

    for (const season of seasons) {
      if (season.episodes.length === 0) {
        toast({ title: 'Empty season', description: `Season ${season.seasonNumber} has no episodes`, variant: 'destructive' });
        return;
      }
      for (const episode of season.episodes) {
        const videoMode = (episode as any).videoMode || 'url';
        const thumbnailMode = (episode as any).thumbnailMode || 'url';

        if (videoMode === 'url' && !episode.videoUrl) {
          toast({ title: 'Missing video', description: `S${season.seasonNumber}E${episode.episodeNumber}: Please provide video URL`, variant: 'destructive' });
          return;
        }
        if (videoMode === 'file' && !(episode as any).videoFile) {
          toast({ title: 'Missing video', description: `S${season.seasonNumber}E${episode.episodeNumber}: Please select video file`, variant: 'destructive' });
          return;
        }
        if (thumbnailMode === 'url' && !episode.thumbnailUrl) {
          toast({ title: 'Missing thumbnail', description: `S${season.seasonNumber}E${episode.episodeNumber}: Please provide thumbnail URL`, variant: 'destructive' });
          return;
        }
        if (thumbnailMode === 'file' && !(episode as any).thumbnailFile) {
          toast({ title: 'Missing thumbnail', description: `S${season.seasonNumber}E${episode.episodeNumber}: Please select thumbnail file`, variant: 'destructive' });
          return;
        }
      }
    }

    try {
      setUploading(true);
      setProgress(0);

      let finalThumbnailUrl = thumbnailUrl;

      // Upload series thumbnail if file
      if (thumbnailMode === 'file' && thumbnailFile) {
        const { uploadUrl, thumbnailUrl: uploadedUrl } = await seriesService.requestThumbnailUploadUrl(thumbnailFile);
        await seriesService.uploadToS3(uploadUrl, thumbnailFile);
        finalThumbnailUrl = uploadedUrl;
      }

      // Upload all episodes
      const totalEpisodes = seasons.reduce((sum, s) => sum + s.episodes.length, 0);
      let uploadedCount = 0;

      const processedSeasons = await Promise.all(
        seasons.map(async (season) => {
          const processedEpisodes = await Promise.all(
            season.episodes.map(async (episode, idx) => {
              let episodeVideoUrl = episode.videoUrl;
              let episodeThumbUrl = episode.thumbnailUrl;

              // Upload video if file
              if ((episode as any).videoFile) {
                const { uploadUrl, videoUrl } = await seriesService.requestVideoUploadUrl((episode as any).videoFile);
                await seriesService.uploadToS3(uploadUrl, (episode as any).videoFile);
                episodeVideoUrl = videoUrl;
              }

              // Upload thumbnail if file
              if ((episode as any).thumbnailFile) {
                const { uploadUrl, thumbnailUrl: uploadedEpisodeThumbUrl } = await seriesService.requestThumbnailUploadUrl((episode as any).thumbnailFile);
                await seriesService.uploadToS3(uploadUrl, (episode as any).thumbnailFile);
                episodeThumbUrl = uploadedEpisodeThumbUrl;
              }

              uploadedCount++;
              setProgress(Math.round((uploadedCount / totalEpisodes) * 90)); // 0-90% for uploads

              return {
                episodeNumber: episode.episodeNumber,
                title: episode.title,
                description: episode.description,
                videoUrl: episodeVideoUrl,
                thumbnailUrl: episodeThumbUrl,
              };
            })
          );

          return {
            seasonNumber: season.seasonNumber,
            title: season.title,
            description: season.description,
            episodes: processedEpisodes,
          };
        })
      );

      setProgress(95);

      // Create series
      await seriesService.createSeries({
        title,
        description,
        genre: selectedGenres.join(', '),
        thumbnailUrl: finalThumbnailUrl,
        seasons: processedSeasons,
      });

      setProgress(100);
      toast({ title: 'Success', description: 'Series created successfully!', variant: 'default' });
      onClose();
    } catch (err: any) {
      console.error('Upload error', err);
      toast({ title: 'Failed', description: err?.response?.data?.message || err.message || 'Failed to create series', variant: 'destructive' });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto">
      {/* Series Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Series Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Series title" className="mt-2" />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Series description..." className="mt-2" rows={3} />
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
              <Button variant={thumbnailMode === 'url' ? 'default' : 'outline'} size="sm" onClick={() => { setThumbnailMode('url'); setThumbnailFile(null); }}>
                URL
              </Button>
              <Button variant={thumbnailMode === 'file' ? 'default' : 'outline'} size="sm" onClick={() => { setThumbnailMode('file'); setThumbnailUrl(''); }}>
                Upload File
              </Button>
            </div>

            {thumbnailMode === 'url' ? (
              <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="mt-2" />
            ) : (
              <>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleThumbnailFileChange} className="mt-2" />
                {thumbnailFile && <p className="text-sm mt-1">Selected: {thumbnailFile.name}</p>}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seasons Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Seasons & Episodes</Label>
          <Button size="sm" variant="outline" onClick={addSeason} disabled={uploading}>
            <Plus className="w-4 h-4 mr-1" /> Add Season
          </Button>
        </div>

        {seasons.map((season, seasonIdx) => (
          <Card key={seasonIdx}>
            <div className="flex items-center justify-between p-4 cursor-pointer border-b hover:bg-secondary/50" onClick={() => toggleSeason(season.seasonNumber)}>
              <div className="flex items-center gap-3">
                <ChevronDown className={`w-5 h-5 transition-transform ${expandedSeasons.has(season.seasonNumber) ? '' : '-rotate-90'}`} />
                <div>
                  <p className="font-semibold">Season {season.seasonNumber}</p>
                  <p className="text-xs text-muted-foreground">{season.episodes.length} episodes</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); removeSeason(seasonIdx); }} disabled={uploading}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {expandedSeasons.has(season.seasonNumber) && (
              <CardContent className="space-y-4 pt-4">
                <div>
                  <Label>Season {season.seasonNumber} Title</Label>
                  <Input value={season.title} onChange={(e) => updateSeason(seasonIdx, 'title', e.target.value)} className="mt-2" />
                </div>

                <div>
                  <Label>Season {season.seasonNumber} Description</Label>
                  <Textarea value={season.description} onChange={(e) => updateSeason(seasonIdx, 'description', e.target.value)} className="mt-2" rows={2} />
                </div>

                {/* Episodes */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <Label>Episodes</Label>
                    <Button size="sm" variant="outline" onClick={() => addEpisode(seasonIdx)} disabled={uploading}>
                      <Plus className="w-4 h-4 mr-1" /> Add Episode
                    </Button>
                  </div>

                  {season.episodes.map((episode, epIdx) => (
                    <Card key={epIdx} className="bg-muted/50">
                      <CardContent className="space-y-3 pt-4">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold">Episode {episode.episodeNumber}</p>
                          <Button size="sm" variant="ghost" onClick={() => removeEpisode(seasonIdx, epIdx)} disabled={uploading}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div>
                          <Label className="text-xs">Title</Label>
                          <Input value={episode.title} onChange={(e) => updateEpisode(seasonIdx, epIdx, 'title', e.target.value)} className="mt-1" />
                        </div>

                        <div>
                          <Label className="text-xs">Description</Label>
                          <Textarea value={episode.description} onChange={(e) => updateEpisode(seasonIdx, epIdx, 'description', e.target.value)} className="mt-1" rows={2} />
                        </div>

                        <div>
                          <Label className="text-xs">Video</Label>
                          <div className="flex gap-2 mt-1 mb-2">
                            <Button 
                              variant={(episode as any).videoMode === 'url' ? 'default' : 'outline'} 
                              size="sm" 
                              onClick={() => {
                                updateEpisode(seasonIdx, epIdx, 'videoMode', 'url');
                                updateEpisode(seasonIdx, epIdx, 'videoFile', null);
                              }}
                            >
                              URL
                            </Button>
                            <Button 
                              variant={(episode as any).videoMode === 'file' ? 'default' : 'outline'} 
                              size="sm" 
                              onClick={() => {
                                updateEpisode(seasonIdx, epIdx, 'videoMode', 'file');
                                updateEpisode(seasonIdx, epIdx, 'videoUrl', '');
                              }}
                            >
                              File
                            </Button>
                          </div>
                          {(episode as any).videoMode === 'url' ? (
                            <Input value={episode.videoUrl} onChange={(e) => updateEpisode(seasonIdx, epIdx, 'videoUrl', e.target.value)} placeholder="Video URL" />
                          ) : (
                            <>
                              <input type="file" accept="video/mp4,video/quicktime,video/x-matroska" onChange={(e) => handleEpisodeVideoFileChange(seasonIdx, epIdx, e)} />
                              {(episode as any).videoFile && <p className="text-xs mt-1">{(episode as any).videoFile.name}</p>}
                            </>
                          )}
                        </div>

                        <div>
                          <Label className="text-xs">Thumbnail</Label>
                          <div className="flex gap-2 mt-1 mb-2">
                            <Button 
                              variant={(episode as any).thumbnailMode === 'url' ? 'default' : 'outline'} 
                              size="sm" 
                              onClick={() => {
                                updateEpisode(seasonIdx, epIdx, 'thumbnailMode', 'url');
                                updateEpisode(seasonIdx, epIdx, 'thumbnailFile', null);
                              }}
                            >
                              URL
                            </Button>
                            <Button 
                              variant={(episode as any).thumbnailMode === 'file' ? 'default' : 'outline'} 
                              size="sm" 
                              onClick={() => {
                                updateEpisode(seasonIdx, epIdx, 'thumbnailMode', 'file');
                                updateEpisode(seasonIdx, epIdx, 'thumbnailUrl', '');
                              }}
                            >
                              File
                            </Button>
                          </div>
                          {(episode as any).thumbnailMode === 'url' ? (
                            <Input value={episode.thumbnailUrl} onChange={(e) => updateEpisode(seasonIdx, epIdx, 'thumbnailUrl', e.target.value)} placeholder="Thumbnail URL" />
                          ) : (
                            <>
                              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => handleEpisodeThumbFileChange(seasonIdx, epIdx, e)} />
                              {(episode as any).thumbnailFile && <p className="text-xs mt-1">{(episode as any).thumbnailFile.name}</p>}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {uploading && (
        <Card>
          <CardContent className="pt-4">
            <Label>Uploading</Label>
            <div className="w-full bg-secondary/30 rounded h-2 mt-2">
              <div className="bg-primary h-2 rounded" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm mt-1">{progress}%</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 pt-4 sticky bottom-0 bg-background">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button className="flex-1 btn-cinema" onClick={handleSubmit} disabled={uploading || seasons.length === 0}>
          {uploading ? `Uploading (${progress}%)` : 'Create Series'}
        </Button>
      </div>
    </div>
  );
}
