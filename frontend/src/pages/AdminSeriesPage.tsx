import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { genres } from '@/data/mockData';
import SeriesUploadForm from '@/components/admin/SeriesUploadForm';
import * as seriesService from '@/services/seriesService';
import { Series } from '@/types';

export default function AdminSeriesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [activeSeries, setActiveSeries] = useState<Series | null>(null);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number | null>(null);
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeDescription, setEpisodeDescription] = useState('');
  const [episodeVideoUrl, setEpisodeVideoUrl] = useState('');
  const [episodeThumbnailUrl, setEpisodeThumbnailUrl] = useState('');
  const [savingEpisode, setSavingEpisode] = useState(false);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeries();
  }, []);

  const openAddEpisodeModal = (seriesItem: Series) => {
    setActiveSeries(seriesItem);
    setSelectedSeasonNumber(seriesItem.seasons?.[0]?.seasonNumber ?? null);
    setEpisodeTitle('');
    setEpisodeDescription('');
    setEpisodeVideoUrl('');
    setEpisodeThumbnailUrl('');
    setShowEpisodeModal(true);
  };

  const closeAddEpisodeModal = () => {
    setShowEpisodeModal(false);
    setActiveSeries(null);
    setSelectedSeasonNumber(null);
    setEpisodeTitle('');
    setEpisodeDescription('');
    setEpisodeVideoUrl('');
    setEpisodeThumbnailUrl('');
  };

  const getActiveSeason = () => {
    return activeSeries?.seasons?.find((season) => season.seasonNumber === selectedSeasonNumber) ?? null;
  };

  const handleAddEpisode = async () => {
    if (!activeSeries) return;
    const season = getActiveSeason();
    if (!season) {
      toast({ title: 'No season selected', description: 'Please select a valid season', variant: 'destructive' });
      return;
    }

    if (!episodeTitle || !episodeVideoUrl || !episodeThumbnailUrl) {
      toast({ title: 'Missing episode data', description: 'Please provide title, video URL, and thumbnail URL', variant: 'destructive' });
      return;
    }

    const nextEpisodeNumber = Math.max(0, ...season.episodes.map((episode) => episode.episodeNumber || 0)) + 1;

    const newEpisode = {
      episodeNumber: nextEpisodeNumber,
      title: episodeTitle,
      description: episodeDescription,
      videoUrl: episodeVideoUrl,
      thumbnailUrl: episodeThumbnailUrl,
    };

    const updatedSeasons = activeSeries.seasons.map((s) =>
      s.seasonNumber === season.seasonNumber
        ? { ...s, episodes: [...s.episodes, newEpisode] }
        : s
    );

    const seriesId = activeSeries._id || activeSeries.id || '';
    if (!seriesId) {
      toast({ title: 'Unable to update', description: 'Series ID is missing', variant: 'destructive' });
      return;
    }

    try {
      setSavingEpisode(true);
      const updatedSeries = await seriesService.updateSeries(seriesId, { seasons: updatedSeasons });
      toast({ title: 'Episode added', description: `Episode ${newEpisode.episodeNumber} added to ${season.title}`, variant: 'default' });
      setActiveSeries(updatedSeries);
      setSeries((prev) => prev.map((item) => (item._id === updatedSeries._id ? updatedSeries : item)));
      setEpisodeTitle('');
      setEpisodeDescription('');
      setEpisodeVideoUrl('');
      setEpisodeThumbnailUrl('');
    } catch (error) {
      console.error('Failed to add episode:', error);
      toast({ title: 'Failed', description: 'Could not add episode', variant: 'destructive' });
    } finally {
      setSavingEpisode(false);
    }
  };

  const handleDeleteEpisode = async (episodeNumber: number) => {
    if (!activeSeries) return;
    const season = getActiveSeason();
    if (!season) return;

    if (season.episodes.length <= 1) {
      toast({ title: 'Cannot delete episode', description: 'A season must contain at least one episode', variant: 'destructive' });
      return;
    }

    if (!window.confirm(`Delete episode ${episodeNumber} from ${season.title}?`)) {
      return;
    }

    const updatedSeasons = activeSeries.seasons.map((s) =>
      s.seasonNumber === season.seasonNumber
        ? { ...s, episodes: s.episodes.filter((episode) => episode.episodeNumber !== episodeNumber) }
        : s
    );

    const seriesId = activeSeries._id || activeSeries.id || '';
    if (!seriesId) {
      toast({ title: 'Unable to update', description: 'Series ID is missing', variant: 'destructive' });
      return;
    }

    try {
      setSavingEpisode(true);
      const updatedSeries = await seriesService.updateSeries(seriesId, { seasons: updatedSeasons });
      toast({ title: 'Episode deleted', description: `Episode ${episodeNumber} removed`, variant: 'default' });
      setActiveSeries(updatedSeries);
      setSeries((prev) => prev.map((item) => (item._id === updatedSeries._id ? updatedSeries : item)));
    } catch (error) {
      console.error('Failed to delete episode:', error);
      toast({ title: 'Failed', description: 'Could not delete episode', variant: 'destructive' });
    } finally {
      setSavingEpisode(false);
    }
  };

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const data = await seriesService.getAllSeries();
      setSeries(data || []);
    } catch (error) {
      console.error('Failed to fetch series:', error);
      toast({ title: 'Failed', description: 'Failed to fetch series', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSeriesAdded = () => {
    setShowAddModal(false);
    fetchSeries();
  };

  const handleDeleteSeries = async (seriesId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await seriesService.deleteSeries(seriesId);
      toast({ title: 'Success', description: 'Series deleted successfully', variant: 'default' });
      fetchSeries();
    } catch (error) {
      console.error('Failed to delete series:', error);
      toast({ title: 'Failed', description: 'Failed to delete series', variant: 'destructive' });
    }
  };

  const filteredSeries = series.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">Web Series Management</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Manage all web series on your platform
            </p>
          </div>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="btn-cinema">
                <Plus className="w-4 h-4 mr-2" />
                Add New Series 
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Web Series</DialogTitle>
              </DialogHeader>
              <SeriesUploadForm onClose={handleSeriesAdded} genres={genres} />
            </DialogContent>
          </Dialog>

          <Dialog open={showEpisodeModal} onOpenChange={(open) => { if (!open) closeAddEpisodeModal(); setShowEpisodeModal(open); }}>
            <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Episode to Series</DialogTitle>
                {activeSeries && <p className="text-sm text-muted-foreground mt-1">Series: {activeSeries.title}</p>}
              </DialogHeader>

              {activeSeries?.seasons?.length ? (
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Season</Label>
                    <select
                      value={selectedSeasonNumber ?? ''}
                      onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
                      className="mt-2 w-full rounded border border-input bg-background px-3 py-2"
                    >
                      {activeSeries.seasons.map((season) => (
                        <option key={season.seasonNumber} value={season.seasonNumber}>
                          {season.title} (Season {season.seasonNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <Label>Episode Title</Label>
                      <Input value={episodeTitle} onChange={(e) => setEpisodeTitle(e.target.value)} className="mt-2" placeholder="Episode title" />
                    </div>
                    <div>
                      <Label>Episode Number</Label>
                      <Input value={getActiveSeason() ? Math.max(0, ...getActiveSeason()!.episodes.map((ep) => ep.episodeNumber || 0)) + 1 : ''} readOnly className="mt-2 bg-secondary/10" />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea value={episodeDescription} onChange={(e) => setEpisodeDescription(e.target.value)} className="mt-2" rows={3} placeholder="Episode description" />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <Label>Video URL</Label>
                      <Input value={episodeVideoUrl} onChange={(e) => setEpisodeVideoUrl(e.target.value)} className="mt-2" placeholder="https://" />
                    </div>
                    <div>
                      <Label>Thumbnail URL</Label>
                      <Input value={episodeThumbnailUrl} onChange={(e) => setEpisodeThumbnailUrl(e.target.value)} className="mt-2" placeholder="https://" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Existing Episodes</p>
                      <span className="text-xs text-muted-foreground">Season {selectedSeasonNumber}</span>
                    </div>
                    <div className="space-y-2">
                      {getActiveSeason()?.episodes.map((episode) => (
                        <div key={episode.episodeNumber} className="flex items-center justify-between gap-4 rounded border border-muted/50 bg-muted/10 p-3">
                          <div>
                            <p className="text-sm font-medium">E{episode.episodeNumber}: {episode.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{episode.description || 'No description'}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEpisode(episode.episodeNumber)}
                            disabled={savingEpisode || getActiveSeason()?.episodes.length === 1}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 items-center">
                    <Button variant="outline" className="flex-1" onClick={closeAddEpisodeModal} disabled={savingEpisode}>
                      Cancel
                    </Button>
                    <Button className="flex-1 btn-cinema" onClick={handleAddEpisode} disabled={savingEpisode}>
                      {savingEpisode ? 'Saving...' : 'Add Episode'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <p className="text-sm text-muted-foreground">This series does not have any seasons yet. Add a season first before adding episodes.</p>
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={closeAddEpisodeModal}>
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Search bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search series by title or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* Series Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading series...</p>
          </div>
        ) : filteredSeries.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel rounded-lg overflow-hidden"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Seasons</TableHead>
                    <TableHead>Episodes</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSeries.map((item) => {
                    const totalEpisodes = item.seasons?.reduce((sum, s) => sum + s.episodes.length, 0) || 0;
                    const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-';

                    return (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium max-w-xs truncate">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.genre?.split(',')[0] || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.seasons?.length || 0}</TableCell>
                        <TableCell>{totalEpisodes}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{createdDate}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openAddEpisodeModal(item)}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSeries(item._id || '', item.title)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        ) : (
          <div className="glass-panel rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">No series found</p>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button className="btn-cinema">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Series
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Web Series</DialogTitle>
                </DialogHeader>
                <SeriesUploadForm onClose={handleSeriesAdded} genres={genres} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </motion.div>
    </div>
  );
}
