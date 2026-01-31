import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Film,
  ListVideo,
  Users,
  Tv,
  User,
  Settings,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';

interface SidebarProps {
  className?: string;
}

const sidebarLinks = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/movies', icon: Film, label: 'Browse' },
  { href: '/playlists', icon: ListVideo, label: 'Playlists' },
  { href: '/groups', icon: Users, label: 'Groups' },
  { href: '/watch-party', icon: Tv, label: 'Watch Party' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const adminLinks = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/movies', icon: Film, label: 'Manage Movies' },
  { href: '/admin/users', icon: Users, label: 'Manage Users' },
];

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        'fixed left-0 top-0 h-screen pt-16 z-30 bg-sidebar border-r border-sidebar-border transition-all duration-300 hidden md:block',
        isCollapsed ? 'w-16' : 'w-56',
        className
      )}
    >
      <div className="flex flex-col h-full py-4">
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-accent border border-sidebar-border"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>

        {/* Main Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <NavLink
                key={link.href}
                to={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <link.icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-current')} />
                {!isCollapsed && (
                  <span className="font-medium text-sm">{link.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Admin Section */}
        {isAdmin && (
          <div className="px-2 pt-4 border-t border-sidebar-border">
            {!isCollapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </p>
            )}
            <nav className="space-y-1">
              {adminLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <NavLink
                    key={link.href}
                    to={link.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <link.icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="font-medium text-sm">{link.label}</span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        {/* Settings */}
        <div className="px-2 pt-4 border-t border-sidebar-border">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
          </NavLink>
        </div>
      </div>
    </motion.aside>
  );
}
