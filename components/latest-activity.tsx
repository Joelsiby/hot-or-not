'use client';

import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LatestActivitySkeleton } from '@/components/latest-activity-skeleton';
import { usePresence } from '@/hooks/use-presence';
import { useDefaultCollapsed } from '@/hooks/use-default-collapsed';
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

export function LatestActivity({ comments, isLoading }: LatestActivityProps) {
  const online = usePresence();
  const { open, toggle } = useDefaultCollapsed();

  if (isLoading) return <LatestActivitySkeleton />;

  const recent = [...comments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center justify-between gap-2 text-left"
          aria-expanded={open}
        >
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex size-1.5 rounded-full bg-primary"></span>
            </span>
            Latest activity
          </CardTitle>
          <div className="flex shrink-0 items-center gap-2">
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
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0',
                open && 'rotate-180'
              )}
            />
          </div>
        </button>
      </CardHeader>
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet.</p>
            ) : (
              <div className="space-y-2">
                {recent.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex items-center justify-between text-sm min-w-0 gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className={cn(
                          'shrink-0',
                          comment.side === 'hot' ? 'text-sky-600' : 'text-red-600'
                        )}
                      >
                        {comment.side === 'hot' ? '⚡' : '🔥'}
                      </span>
                      <span className="font-medium shrink-0 max-w-24 truncate">
                        {comment.authorName}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {comment.side === 'hot' ? 'Love it' : 'Hate it'}
                      </Badge>
                      <span className="text-xs text-muted-foreground min-w-0 flex-1 truncate">
                        {comment.body}
                      </span>
                    </div>
                    <span
                      className="text-xs text-muted-foreground flex-shrink-0"
                      suppressHydrationWarning
                    >
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
