export interface Movie {
  slug: string;
  title: string;
  posterEmoji: string;
}

// Static seed list — always present regardless of whether Supabase (and
// therefore the live controversy bot, see lib/controversy-bot) is
// configured. Toxic is first, so it's the default selection on load.
//
// Client-safe: no Node-only imports here. The dynamic merge with
// bot-promoted movies (Supabase + local JSON fallback) lives in
// lib/movies-server.ts instead, since it touches `fs` / the Supabase
// server client and app/page.tsx (a Client Component) imports this file.
export const staticMovies: Movie[] = [
  { slug: 'toxic', title: 'Toxic', posterEmoji: '🔥' },
  { slug: 'kalki-2', title: 'Kalki 2', posterEmoji: '🪐' },
  { slug: 'pushpa-3', title: 'Pushpa 3', posterEmoji: '🌿' },
  { slug: 'dacoit', title: 'Dacoit', posterEmoji: '🔫' },
];

// Back-compat alias — components that only need the static list still
// import this directly.
export const movies = staticMovies;

export function getMovie(slug: string): Movie | undefined {
  return staticMovies.find((m) => m.slug === slug);
}
