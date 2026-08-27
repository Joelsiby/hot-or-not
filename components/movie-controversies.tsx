'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame } from 'lucide-react';

interface ControversyItem {
  id: string;
  title: string;
  sourceUrl: string;
  publishedAt: string;
}

interface MovieControversiesProps {
  movieSlug: string;
  movieTitle: string;
}

// Fetches real, movie-specific controversy headlines (Google News search
// for "<title>" backlash/controversy/boycott/review bomb — see
// lib/movie-controversy-search.ts) the moment a movie is selected. Not a
// global feed — every click re-fetches for whichever movie is now showing.
export function MovieControversies({ movieSlug, movieTitle }: MovieControversiesProps) {
  const [items, setItems] = useState<ControversyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the loading state when the selected movie changes is this effect's whole purpose
    setIsLoading(true);

    fetch(`/api/movie-controversies?movie=${movieSlug}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => {
        if (!cancelled && Array.isArray(data.items)) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [movieSlug]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Flame className="h-4 w-4 text-muted-foreground" />
          Controversy watch — {movieTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent controversy buzz found for {movieTitle}.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="text-sm">
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline line-clamp-2"
                >
                  {item.title}
                </a>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(item.publishedAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
