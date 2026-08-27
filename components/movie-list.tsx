'use client';

import { movies as staticMovies, type Movie } from '@/lib/movies';
import { cn } from '@/lib/utils';

interface MovieListProps {
  selectedSlug: string;
  onSelect: (slug: string) => void;
  movies?: Movie[];
  className?: string;
}

// A small, quiet row of movie pills — picking one just switches which
// movie's comment feed is showing. Defaults to the static list; page.tsx
// passes the static list merged with movies the live controversy bot
// auto-added.
export function MovieList({ selectedSlug, onSelect, movies = staticMovies, className }: MovieListProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 overflow-x-auto', className)}>
      {movies.map((movie) => {
        const isSelected = movie.slug === selectedSlug;
        return (
          <button
            key={movie.slug}
            type="button"
            onClick={() => onSelect(movie.slug)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span>{movie.posterEmoji}</span>
            {movie.title}
          </button>
        );
      })}
    </div>
  );
}
