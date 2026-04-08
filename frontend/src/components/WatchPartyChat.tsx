import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useWatchPartyStore } from '@/stores/watchPartyStore';
import { useAuthStore } from '@/stores/authStore';

interface WatchPartyChatProps {
  onSendMessage: (message: string) => void;
}

export default function WatchPartyChat({ onSendMessage }: WatchPartyChatProps) {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages } = useWatchPartyStore();
  const { user } = useAuthStore();

  // Debug: Log messages whenever they change
  useEffect(() => {
    console.log('Messages in store updated:', messages);
  }, [messages]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    onSendMessage(messageText.trim());
    setMessageText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/40 rounded-xl border border-border/50 overflow-hidden">
      {/* Chat header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border/30 bg-gradient-to-r from-card/80 to-card/60">
        <h3 className="font-semibold text-sm text-white">Watch Party Chat</h3>
        <p className="text-xs text-muted-foreground mt-1">Messages only saved during party</p>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 w-full min-h-0">
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-8">
              <p>No messages yet. Start the conversation! 💬</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="flex gap-2">
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-slate-700 border border-slate-600">
                  {msg.avatar ? (
                    <img src={msg.avatar} alt={msg.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white">
                      {msg.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white">{msg.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 break-words mt-1">{msg.message}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="flex-shrink-0 p-3 border-t border-border/30 bg-card/60 backdrop-blur">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-muted-foreground focus-visible:ring-emerald-500"
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
