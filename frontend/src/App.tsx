import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BrowsePage from "./pages/BrowsePage";
import MovieDetailsPage from "./pages/MovieDetailsPage";
import WebSeriesPage from "./pages/WebSeriesPage";
import SeriesDetailsPage from "./pages/SeriesDetailsPage";
import SeriesPlayerPage from "./pages/SeriesPlayerPage";
import PlayerPage from "./pages/PlayerPage";
import ProfilePage from "./pages/ProfilePage";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import WatchPartyPage from "./pages/WatchPartyPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMoviesPage from "./pages/AdminMoviesPage";
import AdminSeriesPage from "./pages/AdminSeriesPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import PricingPage from "./pages/PricingPage";
import CheckoutPage from "./pages/CheckoutPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth Pages - No Layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Player - Full Screen */}
          <Route path="/player/:id" element={<PlayerPage />} />
          <Route path="/series/:seriesId/player/:seasonNumber/:episodeNumber" element={<SeriesPlayerPage />} />
          
          {/* Main App with Layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<BrowsePage />} />
            <Route path="/movies/:id" element={<MovieDetailsPage />} />
            <Route path="/series" element={<WebSeriesPage />} />
            <Route path="/series/:id" element={<SeriesDetailsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
            <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailPage /></ProtectedRoute>} />
            <Route path="/watch-party" element={<WatchPartyPage />} />
            <Route path="/watch-party/:groupId" element={<WatchPartyPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/movies" element={<ProtectedRoute requireAdmin><AdminMoviesPage /></ProtectedRoute>} />
            <Route path="/admin/series" element={<ProtectedRoute requireAdmin><AdminSeriesPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsersPage /></ProtectedRoute>} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
