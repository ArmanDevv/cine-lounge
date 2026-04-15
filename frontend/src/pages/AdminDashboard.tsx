import { motion } from 'framer-motion';
import { 
  Users, 
  Film, 
  Eye, 
  TrendingUp, 
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAdminStats, mockMovies } from '@/data/mockData';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const stats = mockAdminStats;

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      change: '+12%',
      trend: 'up',
      icon: Users,
      description: `${stats.newUsersToday} new today`,
    },
    {
      title: 'Total Movies',
      value: stats.totalMovies.toLocaleString(),
      change: '+8%',
      trend: 'up',
      icon: Film,
      description: '15 added this week',
    },
    {
      title: 'Total Views',
      value: `${(stats.totalViews / 1000000).toFixed(1)}M`,
      change: '+23%',
      trend: 'up',
      icon: Eye,
      description: `${stats.viewsToday.toLocaleString()} today`,
    },
    {
      title: 'Active Watch Parties',
      value: stats.activeWatchParties.toString(),
      change: '-5%',
      trend: 'down',
      icon: TrendingUp,
      description: 'Live right now',
    },
  ];

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
          <Link to="/admin/movies">
            <Button className="btn-cinema text-xs sm:text-base h-9 sm:h-10 w-full sm:w-auto">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Add Movie
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
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
                    <span
                      className={`text-xs flex items-center ${
                        stat.trend === 'up' ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      ) : (
                        <ArrowDownRight className="w-2.5 h-2.5" />
                      )}
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {stat.description}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
              <div className="space-y-2 sm:space-y-4">
                {mockMovies.slice(0, 5).map((movie) => (
                  <div key={movie.id} className="flex items-center gap-2 sm:gap-3">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1 text-xs sm:text-sm">{movie.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {movie.year} • {movie.genre.slice(0, 2).join(', ')}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm font-medium">
                        {(movie.views / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Charts Placeholder */}
          <Card className="glass-panel border-border">
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-secondary/30 rounded-lg">
                <p className="text-muted-foreground">
                  Chart visualization placeholder
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
