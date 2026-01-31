import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { motion } from 'framer-motion';

// Pages that should show sidebar
const sidebarPages = ['/profile', '/playlists', '/groups', '/admin', '/watch-party'];

export function MainLayout() {
  const location = useLocation();
  const showSidebar = sidebarPages.some(page => location.pathname.startsWith(page));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex">
        {showSidebar && <Sidebar />}
        
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`flex-1 ${showSidebar ? 'md:ml-56' : ''}`}
        >
          <Outlet />
          <Footer />
        </motion.main>
      </div>
    </div>
  );
}
