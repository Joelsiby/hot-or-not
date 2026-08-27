import { staticMovies, type Movie, getMovie } from './movies';
import { getSupabaseServerClient } from './supabase/server';
import { readLocalMovies } from './local-controversy-data';

// Server-only: static list merged with movies the live controversy bot
// auto-added (Supabase if configured, otherwise whatever
// scripts/controversy_bot.py last wrote to data/movies.json). Kept out of
// lib/movies.ts because that file is imported by Client Components and
// this one touches fs / the Supabase server client.
export async function getAllMovies(): Promise<Movie[]> {
  const merged = [...staticMovies];

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('movies')
      .select('slug, title, poster_emoji')
      .order('created_at', { ascending: false });
    if (error || !data) throw error ?? new Error('no data');

    for (const row of data) {
      if (!merged.some((existing) => existing.slug === row.slug)) {
        merged.push({ slug: row.slug, title: row.title, posterEmoji: row.poster_emoji });
      }
    }
    return merged;
  } catch {
    // No Supabase configured (or the query failed) — merge in whatever
    // scripts/controversy_bot.py last wrote to data/movies.json instead.
    const local = await readLocalMovies();
    for (const m of local) {
      if (!merged.some((existing) => existing.slug === m.slug)) merged.push(m);
    }
    return merged;
  }
}

// Like getMovie, but also checks bot-promoted movies — needed wherever a
// movieSlug might be one the live bot added, not just the static list
// (e.g. validating a posted comment).
export async function getMovieAsync(slug: string): Promise<Movie | undefined> {
  const existing = getMovie(slug);
  if (existing) return existing;
  const all = await getAllMovies();
  return all.find((m) => m.slug === slug);
}
