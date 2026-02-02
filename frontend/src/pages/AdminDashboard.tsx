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
    <div className="min-h-screen pt-20 pb-12 px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your platform's performance
            </p>
          </div>
          <Link to="/admin/movies">
            <Button className="btn-cinema">
              <Plus className="w-4 h-4 mr-2" />
              Add Movie
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-panel border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs flex items-center ${
                        stat.trend === 'up' ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {stat.description}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Movies */}
          <Card className="glass-panel border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Movies
                <Link to="/admin/movies">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMovies.slice(0, 5).map((movie) => (
                  <div key={movie.id} className="flex items-center gap-3">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium line-clamp-1">{movie.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {movie.year} • {movie.genre.slice(0, 2).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
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
