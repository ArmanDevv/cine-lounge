import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  ChevronDown,
  Check,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import * as seriesService from '@/services/seriesService';
import { Series, Season, Episode, SeriesWatchProgress } from '@/types';

export default function SeriesDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
  const [watchProgress, setWatchProgress] = useState<Map<string, SeriesWatchProgress>>(new Map());

  useEffect(() => {
    if (id) {
      fetchSeries();
      loadWatchProgress();
    }
  }, [id]);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const data = await seriesService.getSeriesById(id!);
      setSeries(data);
      if (data.seasons && data.seasons.length > 0) {
        setSelectedSeason(data.seasons[0].seasonNumber);
        setExpandedSeasons(new Set([data.seasons[0].seasonNumber]));
      }
    } catch (error) {
      console.error('Failed to fetch series:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWatchProgress = () => {
    const stored = localStorage.getItem(`series_${id}_progress`);
    if (stored) {
      const progressMap = new Map(JSON.parse(stored));
      setWatchProgress(progressMap);
    }
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

  const playEpisode = (episode: Episode, season: Season) => {
    navigate(`/series/${id}/player/${season.seasonNumber}/${episode.episodeNumber}`);
  };

  const getEpisodeProgress = (seasonNum: number, episodeNum: number): number => {
    const key = `${seasonNum}_${episodeNum}`;
    return watchProgress.get(key)?.progress || 0;
  };

  const getSeasonProgress = (season: Season): { completed: number; total: number } => {
    let completed = 0;
    for (const episode of season.episodes) {
      const progress = getEpisodeProgress(season.seasonNumber, episode.episodeNumber);
      if (progress >= 90) completed++;
    }
    return { completed, total: season.episodes.length };
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 sm:pt-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading series...</p>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen pt-16 sm:pt-20 flex items-center justify-center">
        <p className="text-muted-foreground">Series not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Banner */}
      <div className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${series.thumbnailUrl})`,
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-background" />
        </div>

        {/* Info Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8 md:pt-20">
          <Link to="/series" className="mb-4">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-white mb-2 sm:mb-3">{series.title}</h1>
            <p className="text-sm sm:text-base text-white/80 max-w-2xl mb-4">{series.description}</p>
            <div className="flex flex-wrap gap-2">
              {series.genre?.split(',').map((g) => (
                <Badge key={g} variant="secondary" className="text-xs">
                  {g.trim()}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-8 sm:pt-12 pb-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">Seasons & Episodes</h2>

            <div className="space-y-4">
              {series.seasons?.map((season) => {
                const seasonProgress = getSeasonProgress(season);
                const isComplete = seasonProgress.completed === seasonProgress.total;
                const isExpanded = expandedSeasons.has(season.seasonNumber);

                return (
                  <Card key={season.seasonNumber} className="border-border overflow-hidden">
                    {/* Season Header */}
                    <div
                      className="flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => toggleSeason(season.seasonNumber)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1">
                        {/* Progress Indicator */}
                        <div className="flex items-center gap-2">
                          {isComplete ? (
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                              <Check className="w-6 h-6 text-green-500" />
                            </div>
                          ) : (
                            <div className="relative w-10 h-10">
                              <svg className="w-10 h-10 transform -rotate-90">
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="18"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                  className="text-muted"
                                />
                                <circle
                                  cx="20"
                                  cy="20"
                                  r="18"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                  strokeDasharray={`${(seasonProgress.completed / seasonProgress.total) * 113} 113`}
                                  className="text-primary transition-all duration-300"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                                {seasonProgress.completed}/{seasonProgress.total}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold">{season.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {season.episodes.length} episodes
                          </p>
                        </div>
                      </div>

                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                      />
                    </div>

                    {/* Episodes List */}
                    {isExpanded && (
                      <CardContent className="pt-0 border-t">
                        <div className="space-y-2 mt-4">
                          {season.episodes.map((episode) => {
                            const episodeProgress = getEpisodeProgress(season.seasonNumber, episode.episodeNumber);
                            const isWatched = episodeProgress >= 90;

                            return (
                              <motion.div
                                key={`${season.seasonNumber}_${episode.episodeNumber}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                              >
                                <div
                                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                                  onClick={() => playEpisode(episode, season)}
                                >
                                  {/* Thumbnail */}
                                  <div className="relative w-24 h-14 sm:w-32 sm:h-18 rounded overflow-hidden flex-shrink-0">
                                    <img
                                      src={episode.thumbnailUrl}
                                      alt={episode.title}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
                                    </div>

                                    {/* Watched Badge */}
                                    {isWatched && (
                                      <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                                        <Check className="w-3 h-3 text-white" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Episode Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs sm:text-sm font-semibold">
                                        E{episode.episodeNumber.toString().padStart(2, '0')}
                                      </span>
                                      <h4 className="text-sm font-semibold truncate">{episode.title}</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                      {episode.description}
                                    </p>

                                    {/* Progress Bar */}
                                    {episodeProgress > 0 && !isWatched && (
                                      <div className="mt-2">
                                        <Progress value={episodeProgress} className="h-1" />
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {Math.round(episodeProgress)}%
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
