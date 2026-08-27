'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface ControversyItem {
  id: string;
  title: string;
  summary: string | null;
  source: 'reddit' | 'rss';
  source_url: string;
  score: number;
  movie_slug: string | null;
  status: string;
  created_at: string;
}

interface LiveControversiesProps {
  onDebate?: (slug: string) => void;
  className?: string;
}

// Live-scraped Reddit/RSS movie controversies. Pushed instantly to
// connected browsers via Supabase Realtime when lib/controversy-bot
// inserts a new row (fired every 5 min by .github/workflows/fetch-
// controversies.yml); falls back to 30s polling if the anon key isn't
// configured, so it never hard-depends on Realtime being set up.
export function LiveControversies({ onDebate, className }: LiveControversiesProps) {
  const [items, setItems] = useState<ControversyItem[]>([]);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadOnce = () =>
      fetch('/api/controversies')
        .then((res) => (res.ok ? res.json() : { items: [] }))
        .then((data) => {
          if (!cancelled && Array.isArray(data.items)) setItems(data.items);
        })
        .catch(() => {});

    loadOnce();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      const interval = setInterval(loadOnce, 30_000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    const channel = supabase
      .channel('controversies-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'controversies' },
        (payload) => {
          setItems((prev) => [payload.new as ControversyItem, ...prev].slice(0, 20));
        }
      )
      .subscribe((status) => {
        if (!cancelled) setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden', className)}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40">
        <span className={cn('h-2 w-2 rounded-full', isLive ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground')} />
        <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          {isLive ? 'Live controversies' : 'Latest controversies'}
        </span>
      </div>
      <ul className="divide-y divide-border max-h-64 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="px-3 py-2 text-sm flex items-start justify-between gap-2">
            <div className="min-w-0">
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline line-clamp-2"
              >
                {item.title}
              </a>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.source === 'reddit' ? 'Reddit' : 'News'} · {new Date(item.created_at).toLocaleTimeString()}
              </p>
            </div>
            {item.movie_slug && onDebate && (
              <button
                type="button"
                onClick={() => onDebate(item.movie_slug!)}
                className="shrink-0 text-xs font-medium rounded-full px-2.5 py-1 bg-primary text-primary-foreground hover:opacity-90"
              >
                Debate
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
