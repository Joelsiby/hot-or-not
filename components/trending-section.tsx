'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame } from 'lucide-react';
import { TrendingSkeleton } from '@/components/trending-skeleton';
import { cn } from '@/lib/utils';
import type { Comment } from '@/lib/comments-data';

interface NewsItem {
  id: string;
  title: string;
  sourceUrl: string;
}

interface TrendingSectionProps {
  comments: Comment[];
  isLoading: boolean;
  movieSlug: string;
}

// "Trending right now" doubles as this movie's controversy watch: top
// takes by upvotes, plus (below a divider) real news headlines about it —
// fetched on demand per movieSlug (see lib/movie-controversy-search.ts),
// not a separate card.
export function TrendingSection({ comments, isLoading, movieSlug }: TrendingSectionProps) {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the loading state when the selected movie changes is this effect's whole purpose
    setNewsLoading(true);

    fetch(`/api/movie-controversies?movie=${movieSlug}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data.items)) {
          setNewsItems(data.items.map((item: { id: string; title: string; sourceUrl: string }) => item));
        }
      })
      .catch(() => {
        if (!cancelled) setNewsItems([]);
      })
      .finally(() => {
        if (!cancelled) setNewsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [movieSlug]);

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
                      comment.side === 'hot' ? 'text-emerald-600' : 'text-red-600'
                    )}
                  >
                    {comment.side === 'hot' ? '⚡' : '🔥'}
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

        {(newsLoading || newsItems.length > 0) && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">In the news</p>
            {newsLoading ? (
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            ) : (
              <ul className="space-y-1.5">
                {newsItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline line-clamp-2"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
