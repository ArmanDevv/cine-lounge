import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Settings, 
  Users, 
  Tv,
  Calendar,
  Copy,
  Crown,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGroupStore } from '@/stores/groupStore';
import { mockGroups, mockChatMessages, mockScheduledWatches } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { messages, fetchMessages, sendMessage, fetchScheduledWatches, scheduledWatches } = useGroupStore();

  const group = mockGroups.find((g) => g.id === id);
  const chatMessages = mockChatMessages;
  const schedules = mockScheduledWatches;

  useEffect(() => {
    if (id) {
      fetchMessages(id);
      fetchScheduledWatches(id);
    }
  }, [id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!message.trim() || !id) return;
    sendMessage(id, message);
    setMessage('');
  };

  const copyInviteCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.inviteCode);
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (!group) {
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
              <img
                src={group.avatar}
                alt={group.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div>
                <h2 className="font-semibold">{group.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {group.members.length} members • {group.members.filter(m => m.user.isOnline).length} online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/watch-party/${group.id}`}>
                <Button variant="outline" size="sm">
                  <Tv className="w-4 h-4 mr-2" />
                  Watch Party
                </Button>
              </Link>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((msg, index) => {
                const isOwnMessage = msg.senderId === '1';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    <img
                      src={msg.sender.avatar}
                      alt={msg.sender.username}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    <div className={`max-w-md ${isOwnMessage ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{msg.sender.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
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
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Typing Indicator */}
          {isTyping && (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              Someone is typing...
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
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
                disabled={!message.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 border-l border-border bg-card hidden lg:block">
          <Tabs defaultValue="members" className="h-full flex flex-col">
            <TabsList className="w-full justify-start px-2 pt-2 bg-transparent">
              <TabsTrigger value="members" className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Members
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Schedule
              </TabsTrigger>
            </TabsList>

            {/* Members Tab */}
            <TabsContent value="members" className="flex-1 p-4">
              {/* Invite Section */}
              <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Invite Code</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono">{group.inviteCode}</code>
                  <Button variant="ghost" size="icon" onClick={copyInviteCode}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Online Members */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Online — {group.members.filter(m => m.user.isOnline).length}
                </p>
                <div className="space-y-2">
                  {group.members
                    .filter((m) => m.user.isOnline)
                    .map((member) => (
                      <div
                        key={member.user.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="relative">
                          <img
                            src={member.user.avatar}
                            alt={member.user.username}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 online-indicator" />
                        </div>
                        <span className="text-sm flex-1">{member.user.username}</span>
                        {getRoleBadge(member.role)}
                      </div>
                    ))}
                </div>
              </div>

              {/* Offline Members */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Offline — {group.members.filter(m => !m.user.isOnline).length}
                </p>
                <div className="space-y-2">
                  {group.members
                    .filter((m) => !m.user.isOnline)
                    .map((member) => (
                      <div
                        key={member.user.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors opacity-60"
                      >
                        <div className="relative">
                          <img
                            src={member.user.avatar}
                            alt={member.user.username}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 offline-indicator" />
                        </div>
                        <span className="text-sm flex-1">{member.user.username}</span>
                        {getRoleBadge(member.role)}
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="flex-1 p-4">
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="glass-panel rounded-lg p-3">
                    <div className="flex gap-3">
                      <img
                        src={schedule.movie.poster}
                        alt={schedule.movie.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {schedule.movie.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(schedule.scheduledAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(schedule.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {schedule.rsvpUsers.length} attending
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="w-full mt-3" variant="outline">
                      RSVP
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
