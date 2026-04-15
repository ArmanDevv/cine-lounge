import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Edit2, 
  Save, 
  Clock,
  Settings,
  LogOut,
  Calendar,
  Tv
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MovieCard } from '@/components/movie/MovieCard';
import { useAuthStore } from '@/stores/authStore';
import { useMovieStore } from '@/stores/movieStore';
import { subscriptionService } from '@/services/subscriptionService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const { watchHistory, fetchWatchHistory } = useMovieStore();

  useEffect(() => {
    fetchWatchHistory();
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
    <div className="min-h-screen pb-12 overflow-x-hidden">
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div 
          className="h-40 sm:h-48 md:h-64 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920)` 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 -mt-16 sm:-mt-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-gradient-to-br from-primary to-primary/70 border-4 border-background shadow-xl flex items-center justify-center">
                <User className="w-16 h-16 md:w-20 md:h-20 text-primary-foreground" />
              </div>
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
                  <div className="flex items-center gap-4 mb-6">
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
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Member Since</p>
                      <div className="flex items-center gap-2 text-foreground">
                        <Calendar className="w-4 h-4" />
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground mb-1">Movies Watched</p>
                      <div className="flex items-center gap-2 text-foreground">
                        <Tv className="w-4 h-4" />
                        {watchHistory.length}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground mb-1">Subscription</p>
                      <div className="text-foreground font-medium">
                        {user?.subscription?.status === 'active' 
                          ? user.subscription.plan 
                          : 'Free'}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 mt-8">
        <Tabs defaultValue="history">
          <TabsList className="w-full justify-start mb-6 bg-secondary/30">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Watch History
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
