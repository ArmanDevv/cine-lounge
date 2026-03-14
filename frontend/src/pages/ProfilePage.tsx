import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Camera, 
  Edit2, 
  Save, 
  Clock, 
  Heart, 
  ListVideo,
  Settings,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MovieCard } from '@/components/movie/MovieCard';
import { useAuthStore } from '@/stores/authStore';
import { useMovieStore } from '@/stores/movieStore';
import { subscriptionService } from '@/services/subscriptionService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { mockMovies } from '@/data/mockData';
import { usePlaylistStore } from '@/stores/playlistStore';

export default function ProfilePage() {
  const { user, logout, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const { watchHistory, fetchWatchHistory } = useMovieStore();
  const { playlists: allPlaylists, loadPlaylists } = usePlaylistStore();
  const playlists = allPlaylists.filter(p => p.ownerId === user?.id);
  const favoriteMovies = mockMovies.slice(0, 4);

  useEffect(() => {
    fetchWatchHistory();
    loadPlaylists();
  }, []);

  const handleSave = () => {
    // Save profile changes
    setIsEditing(false);
  };

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCancelSubscription = async () => {
    if (!user) return;
    const ok = window.confirm('Are you sure you want to cancel your subscription?');
    if (!ok) return;
    try {
      const res = await subscriptionService.cancelSubscription();
      toast({ title: 'Subscription cancelled', description: res.message });
      setUser({ ...user, subscription: res.subscription });
    } catch (err: any) {
      toast({ title: 'Cancel failed', description: err?.message || 'Could not cancel subscription', variant: 'destructive' });
    }
  };

  const handleManageSubscription = () => {
    const planId = user?.subscription?.plan || 'premium';
    if (planId === 'free') {
      navigate('/pricing');
      return;
    }

    if (!user?.subscription || user.subscription.status !== 'active') {
      // Redirect to checkout for selected plan
      navigate(`/checkout?plan=${planId}`);
    } else {
      // Active subscription - offer cancel
      handleCancelSubscription();
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div 
          className="h-48 md:h-64 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920)` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start gap-6"
          >
            {/* Avatar */}
            <div className="relative">
              <img
                src={user?.avatar}
                alt={user?.username}
                className="w-32 h-32 md:w-40 md:h-40 rounded-xl object-cover border-4 border-background shadow-xl"
              />
              <Button
                size="icon"
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            {/* Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="text-xl font-bold bg-secondary/50"
                    placeholder="Username"
                  />
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-secondary/50"
                    placeholder="Write something about yourself..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{user?.username}</h1>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      className="ml-2"
                      onClick={handleManageSubscription}
                    >
                      {user?.subscription && user.subscription.status === 'active' ? 'Manage Subscription' : 'Upgrade'}
                    </Button>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {user?.bio || 'No bio yet. Click edit to add one!'}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Member since {user?.createdAt}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {watchHistory.length} movies watched
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-2">
                      <strong className="text-foreground">Subscription:</strong>
                      {user?.subscription ? (
                        <span className="text-sm">
                          {user.subscription.plan} — {user.subscription.status}{' '}
                          {user.subscription.expiresAt ? (
                            <span className="text-muted-foreground">(expires {new Date(user.subscription.expiresAt).toLocaleDateString()})</span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Free</span>
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 mt-8">
        <Tabs defaultValue="history">
          <TabsList className="w-full justify-start mb-6 bg-secondary/30">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Watch History
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="playlists" className="flex items-center gap-2">
              <ListVideo className="w-4 h-4" />
              Playlists
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Watch History */}
          <TabsContent value="history">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Continue Watching</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {watchHistory.map((item) => (
                  <div key={item.id} className="relative">
                    <MovieCard movie={item.movie} size="md" showProgress={item.progress} />
                    <p className="mt-2 text-xs text-muted-foreground">
                      Last watched: {new Date(item.lastWatched).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Favorites */}
          <TabsContent value="favorites">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Favorite Movies</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {favoriteMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} size="md" />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Playlists */}
          <TabsContent value="playlists">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Playlists</h2>
                <Button>Create Playlist</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="glass-panel rounded-xl p-4 flex gap-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <img
                      src={playlist.cover || playlist.movies[0]?.poster}
                      alt={playlist.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-semibold">{playlist.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {playlist.movies.length} movies
                      </p>
                      {playlist.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {playlist.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="glass-panel rounded-xl p-6">
                <h3 className="font-semibold mb-4">Account Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <p>{user?.email}</p>
                  </div>
                  <Button variant="outline">Change Password</Button>
                </div>
              </div>

              <div className="glass-panel rounded-xl p-6">
                <h3 className="font-semibold mb-4 text-destructive">Danger Zone</h3>
                <Button variant="destructive" onClick={() => logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
