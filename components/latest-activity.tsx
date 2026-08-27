'use client';

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

export function LatestActivity({ comments, isLoading }: LatestActivityProps) {
  if (isLoading) return <LatestActivitySkeleton />;

  const recent = [...comments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex size-1.5 rounded-full bg-primary"></span>
          </span>
          Latest activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <div className="space-y-2">
            {recent.map((comment) => (
              <div key={comment.id} className="flex items-center justify-between text-sm min-w-0 gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className={cn('shrink-0', comment.side === 'hot' ? 'text-red-600' : 'text-sky-600')}>
                    {comment.side === 'hot' ? '🔥' : '❄️'}
                  </span>
                  <span className="font-medium shrink-0 max-w-24 truncate">{comment.authorName}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {comment.side === 'hot' ? 'Hot' : 'Not'}
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
