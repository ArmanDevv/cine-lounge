import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as seriesService from '@/services/seriesService';
import { Series, SeriesWatchProgress } from '@/types';

interface PlayerParams {
  seriesId: string;
  seasonNumber: string;
  episodeNumber: string;
}

export default function SeriesPlayerPage() {
  const { seriesId, seasonNumber: seasonStr, episodeNumber: episodeStr } = useParams<keyof PlayerParams>();
  const navigate = useNavigate();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const seasonNumber = seasonStr ? parseInt(seasonStr) : 1;
  const episodeNumber = episodeStr ? parseInt(episodeStr) : 1;

  useEffect(() => {
    if (seriesId) {
      fetchSeries();
    }
  }, [seriesId]);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await seriesService.getSeriesById(seriesId!);
      setSeries(data);
    } catch (err) {
      console.error('Failed to fetch series:', err);
      setError('Failed to load series');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentEpisode = () => {
    if (!series) return null;
    const season = series.seasons?.find(s => s.seasonNumber === seasonNumber);
    if (!season) return null;
    const episode = season.episodes.find(e => e.episodeNumber === episodeNumber);
    return episode;
  };

  const goToNextEpisode = () => {
    if (!series) return;
    const season = series.seasons?.find(s => s.seasonNumber === seasonNumber);
    if (!season) return;

    const nextEpisode = season.episodes.find(e => e.episodeNumber === episodeNumber + 1);
    if (nextEpisode) {
      navigate(`/series/${seriesId}/player/${seasonNumber}/${nextEpisode.episodeNumber}`);
    } else {
      // Try to find first episode of next season
      const nextSeason = series.seasons?.find(s => s.seasonNumber === seasonNumber + 1);
      if (nextSeason && nextSeason.episodes.length > 0) {
        navigate(`/series/${seriesId}/player/${nextSeason.seasonNumber}/${nextSeason.episodes[0].episodeNumber}`);
      }
    }
  };

  const goToPreviousEpisode = () => {
    if (!series) return;
    const season = series.seasons?.find(s => s.seasonNumber === seasonNumber);
    if (!season) return;

    const prevEpisode = season.episodes.find(e => e.episodeNumber === episodeNumber - 1);
    if (prevEpisode) {
      navigate(`/series/${seriesId}/player/${seasonNumber}/${prevEpisode.episodeNumber}`);
    } else {
      // Try to find last episode of previous season
      const prevSeason = series.seasons?.find(s => s.seasonNumber === seasonNumber - 1);
      if (prevSeason && prevSeason.episodes.length > 0) {
        const lastEpisodeNum = Math.max(...prevSeason.episodes.map(e => e.episodeNumber));
        navigate(`/series/${seriesId}/player/${prevSeason.seasonNumber}/${lastEpisodeNum}`);
      }
    }
  };

  const backToSeries = () => {
    navigate(`/series/${seriesId}`);
  };

  const updateProgress = (progress: number) => {
    // Save to localStorage
    const progressMap = new Map<string, SeriesWatchProgress>();
    const stored = localStorage.getItem(`series_${seriesId}_progress`);
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.forEach((item: any) => {
        progressMap.set(`${item[0]}`, item[1]);
      });
    }

    const key = `${seasonNumber}_${episodeNumber}`;
    progressMap.set(key, {
      seriesId: seriesId!,
      seasonNumber,
      episodeNumber,
      progress,
      lastWatched: new Date().toISOString(),
    });

    localStorage.setItem(`series_${seriesId}_progress`, JSON.stringify(Array.from(progressMap.entries())));
  };

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center flex-col gap-4">
        <p className="text-white text-lg">{error || 'Series not found'}</p>
        <Button onClick={() => navigate('/series')} variant="default">
          Back to Series
        </Button>
      </div>
    );
  }

  const currentEpisode = getCurrentEpisode();

  if (!currentEpisode) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center flex-col gap-4">
        <p className="text-white text-lg">Episode not found</p>
        <Button onClick={backToSeries} variant="default">
          Back to {series.title}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={backToSeries}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>

      {/* Video Player Container */}
      <div className="flex-1 flex items-center justify-center bg-black w-full">
        <video
          key={`${currentEpisode.videoUrl}`}
          src={currentEpisode.videoUrl}
          controls
          autoPlay
          crossOrigin="anonymous"
          className="w-full h-full"
          style={{ maxHeight: '100vh' }}
          onTimeUpdate={(e) => {
            const progress = (e.currentTarget.currentTime / e.currentTarget.duration) * 100;
            updateProgress(Math.min(progress, 100));
          }}
          onEnded={goToNextEpisode}
          onError={(e) => {
            console.error('Video playback error:', e);
            console.error('Video URL:', currentEpisode.videoUrl);
          }}
        />
      </div>

      {/* Episode Info & Controls */}
      <div className="bg-black/80 backdrop-blur p-4 text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">{series.title}</h1>
            <p className="text-lg text-white/80">
              Season {seasonNumber} · Episode {episodeNumber}: {currentEpisode.title}
            </p>
            <p className="text-sm text-white/60 mt-2">{currentEpisode.description}</p>
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-2">
            <Button
              onClick={goToPreviousEpisode}
              variant="outline"
              disabled={seasonNumber === 1 && episodeNumber === 1}
              className="text-white"
            >
              ← Previous Episode
            </Button>
            <Button
              onClick={goToNextEpisode}
              variant="default"
              className="btn-cinema"
            >
              Next Episode →
            </Button>
            <Button
              onClick={backToSeries}
              variant="outline"
              className="text-white ml-auto"
            >
              Back to Series
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
