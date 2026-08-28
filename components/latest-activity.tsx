'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LatestActivitySkeleton } from '@/components/latest-activity-skeleton';
import { cn } from '@/lib/utils';
import type { Comment } from '@/lib/comments-data';

interface LatestActivityProps {
  comments: Comment[];
  isLoading: boolean;
}

function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'} ago`;
}

const MIN_ONLINE = 15;

// There's no real presence tracking here — this is a believable, gently
// drifting count that never dips below MIN_ONLINE. Starts at the floor
// (matching what the server renders) so hydration never mismatches, then
// randomizes and nudges itself client-side only, after mount.
function useOnlineCount() {
  const [online, setOnline] = useState(MIN_ONLINE);

  useEffect(() => {
    // Randomizing on mount is the whole point here — it has to happen
    // client-only (Math.random() during render would mismatch the
    // server-rendered MIN_ONLINE), so there's no way to fold this into
    // render itself.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOnline(MIN_ONLINE + Math.floor(Math.random() * 35)); // 15-49
    const timer = setInterval(() => {
      setOnline((prev) => Math.max(MIN_ONLINE, prev + Math.floor(Math.random() * 7) - 3)); // nudge -3..+3
    }, 12_000);
    return () => clearInterval(timer);
  }, []);

  return online;
}

export function LatestActivity({ comments, isLoading }: LatestActivityProps) {
  const online = useOnlineCount();

  if (isLoading) return <LatestActivitySkeleton />;

  const recent = [...comments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex size-1.5 rounded-full bg-primary"></span>
            </span>
            Latest activity
          </CardTitle>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[11px] font-semibold text-green-600 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
            suppressHydrationWarning
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-green-500" />
            </span>
            {online} online
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((comment) => (
              <div key={comment.id} className="flex items-center justify-between text-sm min-w-0 gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className={cn('shrink-0', comment.side === 'hot' ? 'text-sky-600' : 'text-red-600')}>
                    {comment.side === 'hot' ? '⚡' : '🔥'}
                  </span>
                  <span className="font-medium shrink-0 max-w-24 truncate">{comment.authorName}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {comment.side === 'hot' ? 'Love it' : 'Hate it'}
                  </Badge>
                  <span className="text-xs text-muted-foreground min-w-0 flex-1 truncate">
                    {comment.body}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0" suppressHydrationWarning>
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
