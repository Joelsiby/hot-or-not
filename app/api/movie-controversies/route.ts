import { NextRequest, NextResponse } from 'next/server';
import { getMovie } from '@/lib/movies';
import { fetchMovieControversies } from '@/lib/movie-controversy-search';

// GET /api/movie-controversies?movie=<slug> — fetched on demand whenever
// a movie is selected (see components/movie-controversies.tsx), not on a
// schedule. Real-time in the sense that it's live-fetched right when you
// click the movie, not cached/stale data.
export async function GET(request: NextRequest) {
  const movieSlug = request.nextUrl.searchParams.get('movie');
  if (!movieSlug) {
    return NextResponse.json({ error: 'movie is required' }, { status: 400 });
  }

  const movie = getMovie(movieSlug);
  if (!movie) {
    return NextResponse.json({ error: 'Unknown movie' }, { status: 400 });
  }

  try {
    const items = await fetchMovieControversies(movie.title);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
