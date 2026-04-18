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
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeries();
  }, []);

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
