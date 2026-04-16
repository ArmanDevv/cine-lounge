import { Loader } from 'lucide-react';

export default function WatchPartyPlayerLoader() {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading video call...</p>
      </div>
    </div>
  );
}
