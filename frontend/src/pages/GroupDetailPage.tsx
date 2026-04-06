import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Send,
  Smile,
  Settings,
  Users,
  Tv,
  Copy,
  Plus,
  Trash2,
  Play,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useGroupStore } from '@/stores/groupStore';
import { useAuthStore } from '@/stores/authStore';
import { useWatchPartyStore } from '@/stores/watchPartyStore';
import { useToast } from '@/hooks/use-toast';
import { socketClient } from '@/services/socketClient';
import { movieService } from '@/services/movieService';
import { Group } from '@/services/groupService';
import { Movie } from '@/types';
import WatchPartyModal from '@/components/WatchPartyModal';
import WatchPartyPlayer from '@/components/WatchPartyPlayer';


export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [messageText, setMessageText] = useState('');
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [availableMovies, setAvailableMovies] = useState<Movie[]>([]);
  const [showMovieDialog, setShowMovieDialog] = useState(false);
  const [showWatchPartyModal, setShowWatchPartyModal] = useState(false);
  const [showWatchPartyPlayer, setShowWatchPartyPlayer] = useState(false);
  const [activeWatchParty, setActiveWatchParty] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuthStore();

  const {
    currentGroup,
    messages,
    isLoading,
    error,
    fetchGroupById,
    addMessage,
    addToPlaylist,
    removeFromPlaylist,
    setCurrentGroup,
  } = useGroupStore();

  // Auto scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (id) {
      fetchGroupById(id);
    }
  }, [id, fetchGroupById]);

  // Socket.IO setup
  useEffect(() => {
    if (!id || !user) return;

    try {
      // Ensure socket client is connected
      socketClient.connect();

      // Join the group room with userId
      socketClient.emit('join_group', id, user.id);
      console.log(`Joined group ${id} with user ${user.id}`);

      // Listen for incoming messages
      const handleReceiveMessage = (data: any) => {
        if (!data || !data.userId) {
          console.warn('Invalid message data received:', data);
          return;
        }

        const newMessage: Group['messages'][0] = {
          senderId: { 
            _id: data.userId, 
            username: data.username || 'Unknown', 
            avatar: data.avatar || '' 
          },
          message: data.message || '',
          createdAt: data.timestamp || new Date().toISOString(),
        };
        addMessage(newMessage);
      };

      socketClient.on('receive_message', handleReceiveMessage);

      // Watch party event handlers
      const handleWatchPartyStart = (data: any) => {
        if (!data || !data.movie) {
          console.warn('Invalid watch party start data:', data);
          return;
        }

        setActiveWatchParty(data);

        // Only the host should immediately start the player
        if (user?.id === data.hostId) {
          const { startWatchParty } = useWatchPartyStore.getState();
          startWatchParty(id, data.movie, data.hostId, data.hostUsername, data.hostAvatar);
          setShowWatchPartyPlayer(true);
        } else {
          // For other members, show a notification/invitation
          toast({
            title: 'Watch Party Started! 🎬',
            description: `${data.hostUsername} started a watch party. Click Watch Party button to join!`,
          });
        }
      };

      const handleWatchPartyMemberJoined = (data: any) => {
        if (!data || !data.userId) return;

        // If this is the current user joining, initialize the store if needed
        if (data.userId === user?.id && !useWatchPartyStore.getState().isActive) {
          // Guard against missing data - use event data as fallback
          const movie = activeWatchParty?.movie || data.movie;
          const hostId = activeWatchParty?.hostId || data.hostId;
          const hostUsername = activeWatchParty?.hostUsername || data.hostUsername;
          const hostAvatar = activeWatchParty?.hostAvatar || data.hostAvatar;

          if (!movie || !hostId) {
            console.error('Missing movie or host data for watch party initialization:', { movie, hostId, activeWatchParty, data });
            toast({
              title: 'Error',
              description: 'Failed to get watch party details. Please refresh and try again.',
              variant: 'destructive',
            });
            return;
          }

          const { joinWatchParty } = useWatchPartyStore.getState();
          joinWatchParty(id, movie, {
            userId: hostId,
            username: hostUsername,
            avatar: hostAvatar,
            isHost: true,
          });
          // Now the host is in the store, request sync
          socketClient.emit('request_playback_sync', {
            groupId: id,
            userId: user.id,
          });
        }

        // Add the member (for all other members and the joining member)
        const { addMember } = useWatchPartyStore.getState();
        addMember({
          userId: data.userId,
          username: data.username || 'Unknown',
          avatar: data.avatar || '',
          isHost: false,
        });

        if (data.userId !== user?.id) {
          toast({
            title: 'Member Joined',
            description: `${data.username} joined the watch party`,
          });
        }
      };

      const handleWatchPartyMemberLeft = (data: any) => {
        if (!data || !data.userId) return;

        const { removeMember } = useWatchPartyStore.getState();
        removeMember(data.userId);

        toast({
          title: 'Member Left',
          description: 'A member left the watch party',
        });
      };

      const handleWatchPartyEnd = () => {
        const { endWatchParty } = useWatchPartyStore.getState();
        endWatchParty();
        setShowWatchPartyPlayer(false);
        setShowWatchPartyModal(false);
        setActiveWatchParty(null);

        toast({
          title: 'Watch Party Ended',
          description: 'The host ended the watch party',
        });
      };

      socketClient.on('watch_party_started', handleWatchPartyStart);
      socketClient.on('watch_party_member_joined', handleWatchPartyMemberJoined);
      socketClient.on('watch_party_member_left', handleWatchPartyMemberLeft);
      socketClient.on('watch_party_ended', handleWatchPartyEnd);

      // Error handler
      const handleError = (error: any) => {
        console.error('Socket error in group detail:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to chat. Please refresh the page.',
          variant: 'destructive',
        });
      };

      socketClient.on('connect_error', handleError);

      // Cleanup on unmount
      return () => {
        socketClient.emit('leave_group', id);
        socketClient.off('receive_message', handleReceiveMessage);
        socketClient.off('watch_party_started', handleWatchPartyStart);
        socketClient.off('watch_party_member_joined', handleWatchPartyMemberJoined);
        socketClient.off('watch_party_member_left', handleWatchPartyMemberLeft);
        socketClient.off('watch_party_ended', handleWatchPartyEnd);
        socketClient.off('connect_error', handleError);
      };
    } catch (error) {
      console.error('Error setting up socket connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to setup chat connection',
        variant: 'destructive',
      });
    }
  }, [id, user, addMessage, toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !id || !user || !currentGroup) {
      console.warn('Cannot send message: missing required data');
      return;
    }

    try {
      const messageData = {
        groupId: id,
        message: messageText.trim(),
        userId: user.id,
        username: user.username,
        avatar: user.avatar || '',
      };

      socketClient.emit('send_message', messageData);
      setMessageText('');
      console.log('Message sent:', messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  const copyInviteCode = () => {
    if (currentGroup) {
      navigator.clipboard.writeText(currentGroup.inviteCode);
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard',
      });
    }
  };

  const handleAddMovie = async (movieId: string) => {
    if (!id) return;
    try {
      await addToPlaylist(id, movieId);
      if (currentGroup) {
        socketClient.emit('playlist_updated', { groupId: id });
      }
      setShowMovieDialog(false);
      toast({
        title: 'Success',
        description: 'Movie added to playlist',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to add movie to playlist',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMovie = async (movieId: string) => {
    if (!id) return;
    try {
      await removeFromPlaylist(id, movieId);
      if (currentGroup) {
        socketClient.emit('playlist_updated', { groupId: id });
      }
      toast({
        title: 'Success',
        description: 'Movie removed from playlist',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to remove movie from playlist',
        variant: 'destructive',
      });
    }
  };

  const fetchAvailableMovies = async () => {
    setIsLoadingMovies(true);
    try {
      const response = await movieService.getMovies();
      setAvailableMovies(response.data || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load movies',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMovies(false);
    }
  };

  const handleWatchPartyButtonClick = () => {
    if (activeWatchParty) {
      if (user?.id === activeWatchParty.hostId) {
        const { isActive } = useWatchPartyStore.getState();
        if (!isActive) {
          const { startWatchParty } = useWatchPartyStore.getState();
          startWatchParty(id, activeWatchParty.movie, activeWatchParty.hostId, activeWatchParty.hostUsername, activeWatchParty.hostAvatar);
        }
        setShowWatchPartyPlayer(true);
      } else {
        socketClient.emit('join_watch_party', {
          groupId: id,
          userId: user.id,
          username: user.username,
          avatar: user.avatar || '',
          movie: activeWatchParty.movie,
          hostId: activeWatchParty.hostId,
          hostUsername: activeWatchParty.hostUsername,
          hostAvatar: activeWatchParty.hostAvatar,
        });
        setShowWatchPartyPlayer(true);
        toast({
          title: 'Joining...',
          description: 'Syncing with the watch party',
        });
      }
    } else {
      setShowWatchPartyModal(true);
    }
  };

  const handleOpenMovieDialog = () => {
    fetchAvailableMovies();
    setShowMovieDialog(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Group Header */}
          <div className="glass-panel border-b border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center font-semibold">
                {currentGroup.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold">{currentGroup.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {currentGroup.members.length} members
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleWatchPartyButtonClick}
              >
                <Tv className="w-4 h-4 mr-2" />
                Watch Party
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwnMessage = msg.senderId._id === user?.id;
                  return (
                    <motion.div
                      key={`${msg.senderId._id}-${msg.createdAt}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                    >
                      <img
                        src={msg.senderId.avatar}
                        alt={msg.senderId.username}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <div className={`max-w-md ${isOwnMessage ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{msg.senderId.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-secondary rounded-tl-sm'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-secondary/50"
              />
              <Button variant="ghost" size="icon">
                <Smile className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                className="btn-cinema"
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-border bg-card hidden lg:flex flex-col">
          <Tabs defaultValue="playlist" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start px-2 pt-2 bg-transparent border-b">
              <TabsTrigger value="playlist" className="flex items-center gap-1">
                <Tv className="w-4 h-4" />
                Playlist
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Members
              </TabsTrigger>
            </TabsList>

            {/* Playlist Tab */}
            <TabsContent value="playlist" className="flex-1 p-4 overflow-y-auto">
              <div className="mb-4">
                <Dialog open={showMovieDialog} onOpenChange={setShowMovieDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={handleOpenMovieDialog} className="w-full btn-cinema">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Movie
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Movie to Playlist</DialogTitle>
                    </DialogHeader>
                    {isLoadingMovies ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {availableMovies.map((movie) => (
                          <div
                            key={movie._id}
                            className="cursor-pointer group"
                            onClick={() => handleAddMovie(movie._id)}
                          >
                            <div className="relative mb-2 overflow-hidden rounded-lg">
                              <img
                                src={movie.thumbnailUrl || ''}
                                alt={movie.title}
                                className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Plus className="w-6 h-6 text-white" />
                              </div>
                            </div>
                            <h4 className="text-sm font-medium line-clamp-2">
                              {movie.title}
                            </h4>
                          </div>
                        ))}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>

              { /* filter out any playlist entries where the movie was removed/deleted */ }
              {currentGroup.playlist &&
              currentGroup.playlist.filter((i) => i.movieId).length > 0 ? (
                (() => {
                  const validPlaylist = currentGroup.playlist.filter((i) => i.movieId);
                  return (
                    <div className="space-y-3">
                      {validPlaylist.map((item) => (
                        <div
                          key={item.movieId?._id ?? item.addedAt}
                          className="glass-panel rounded-lg p-3"
                        >
                          <div className="flex gap-3">
                            <img
                              src={item.movieId?.thumbnailUrl ?? ''}
                              alt={item.movieId?.title ?? 'Unknown movie'}
                              className="w-12 h-16 object-cover rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-1">
                                {item.movieId?.title ?? 'Unknown movie'}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {item.movieId?.genre ?? ''}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Added by {item.addedBy.username}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            {item.movieId?._id && (
                              <Link
                                to={`/player/${item.movieId._id}`}
                                className="flex-1"
                              >
                                <Button size="sm" variant="outline" className="w-full">
                                  <Play className="w-3 h-3 mr-1" />
                                  Watch
                                </Button>
                              </Link>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                item.movieId?._id && handleRemoveMovie(item.movieId._id)
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Tv className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No movies in playlist yet</p>
                </div>
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="flex-1 p-4 overflow-y-auto">
              {/* Invite Section */}
              <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Invite Code</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono">{currentGroup.inviteCode}</code>
                  <Button variant="ghost" size="icon" onClick={copyInviteCode}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Members List */}
              <div>
                {/* dedupe in case backend returned duplicate entries */}
                {(() => {
                  const uniqueMembers = currentGroup.members.filter(
                    (m, idx, arr) =>
                      arr.findIndex(x => x.userId._id === m.userId._id) === idx
                  );
                  return (
                    <>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                        Members ({uniqueMembers.length})
                      </p>
                      <div className="space-y-2">
                        {uniqueMembers.map((member) => (
                          <div
                            key={member.userId._id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                          >
                            <img
                              src={member.userId.avatar}
                              alt={member.userId.username}
                              className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {member.userId.username}
                              </p>
                              {currentGroup.createdBy._id === member.userId._id && (
                                <p className="text-xs text-muted-foreground">Creator</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Watch Party Modal */}
      <WatchPartyModal
        isOpen={showWatchPartyModal}
        onClose={() => setShowWatchPartyModal(false)}
        groupId={id || ''}
        onStartWatchParty={(movie) => {
          setShowWatchPartyPlayer(true);
        }}
      />

      {/* Watch Party Player */}
      {showWatchPartyPlayer && (
        <WatchPartyPlayer
          groupId={id || ''}
          onClose={() => setShowWatchPartyPlayer(false)}
        />
      )}
    </div>
  );
}
