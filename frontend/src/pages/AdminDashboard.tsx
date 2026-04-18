import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { 
  Users, 
  Film, 
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Loader,
  Tv
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import api from '@/services/api';

interface Movie {
  _id: string;
  title: string;
  description: string;
  genre: string;
  thumbnailUrl: string;
  videoUrl: string;
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  watchHistory: Array<{
    movieId: string;
    progress: number;
    lastWatched: string;
  }>;
}

export default function AdminDashboard() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWatchTime, setTotalWatchTime] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch movies
        const moviesResponse = await api.get('/admin/movies');
        const moviesData = moviesResponse.data.data || [];
        setMovies(moviesData);

        // Fetch users
        const usersResponse = await api.get('/auth/users');
        const usersData = usersResponse.data;
        setUsers(usersData);

        // Calculate total watch time (estimate based on watch history)
        let totalMinutes = 0;
        usersData.forEach((user: User) => {
          if (user.watchHistory && user.watchHistory.length > 0) {
            totalMinutes += user.watchHistory.length * 120; // Assuming avg 2 hours per watch
          }
        });
        setTotalWatchTime(totalMinutes);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalUsers = users.length;
  const totalMovies = movies.length;
  const totalWatchHistory = users.reduce((sum, user) => sum + (user.watchHistory?.length || 0), 0);

  const statCards = [
    {
      title: 'Total Users',
      value: totalUsers.toLocaleString(),
      icon: Users,
      description: `${totalUsers} registered users`,
    },
    {
      title: 'Total Movies',
      value: totalMovies.toLocaleString(),
      icon: Film,
      description: `${totalMovies} movies available`,
    },
    {
      title: 'Total Watch History',
      value: totalWatchHistory.toLocaleString(),
      icon: Clock,
      description: `${totalWatchHistory} total watches`,
    },
  ];

  const recentMovies = [...movies].reverse().slice(0, 5);

  return (
    <div className="min-h-screen pt-16 sm:pt-20 pb-8 sm:pb-12 px-3 sm:px-4 md:px-6 lg:px-8 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground mb-1 sm:mb-2">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              Overview of your platform's performance
            </p>
          </div>
          <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
            <Link to="/admin/movies" className="flex-1 sm:flex-none">
              <Button className="btn-cinema text-xs sm:text-base h-9 sm:h-10 w-full">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Add Movie
              </Button>
            </Link>
            <Link to="/admin/series" className="flex-1 sm:flex-none">
              <Button className="btn-cinema text-xs sm:text-base h-9 sm:h-10 w-full">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Add Series
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              {statCards.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-panel border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-4 py-3 sm:py-4">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    </CardHeader>
                    <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                      <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                      <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {stat.description}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Recent Movies */}
            <Card className="glass-panel border-border">
              <CardHeader className="px-3 sm:px-4 py-3 sm:py-4">
                <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                  Recent Movies
                  <Link to="/admin/movies">
                    <Button variant="ghost" size="sm" className="text-xs sm:text-base h-8 sm:h-9">
                      View All
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                {recentMovies.length > 0 ? (
                  <div className="space-y-2 sm:space-y-4">
                    {recentMovies.map((movie) => (
                      <div key={movie._id} className="flex items-center gap-2 sm:gap-3">
                        <img
                          src={movie.thumbnailUrl}
                          alt={movie.title}
                          className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium line-clamp-1 text-xs sm:text-sm">{movie.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {movie.genre}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs sm:text-sm font-medium">
                            {new Date(movie.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Added</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No movies yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>
    </div>
  );
}
