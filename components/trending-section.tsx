'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame } from 'lucide-react';
import { TrendingSkeleton } from '@/components/trending-skeleton';
import { cn } from '@/lib/utils';
import type { Comment } from '@/lib/comments-data';

interface TrendingSectionProps {
  comments: Comment[];
  isLoading: boolean;
}

export function TrendingSection({ comments, isLoading }: TrendingSectionProps) {
  if (isLoading) return <TrendingSkeleton />;

  const top3 = [...comments].sort((a, b) => b.upvotes - a.upvotes).slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-muted-foreground" />
          Trending right now
        </CardTitle>
      </CardHeader>
      <CardContent>
        {top3.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet.</p>
        ) : (
          <div className="space-y-2">
            {top3.map((comment) => (
              <div key={comment.id} className="flex items-center justify-between text-sm min-w-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      'shrink-0 text-xs',
                      comment.side === 'hot' ? 'text-orange-600' : 'text-sky-600'
                    )}
                  >
                    {comment.side === 'hot' ? '🔥' : '❄️'}
                  </span>
                  <span className="font-medium truncate">{comment.body}</span>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {comment.upvotes} upvotes
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
