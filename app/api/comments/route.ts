import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getComments, invalidateCommentsCache } from '@/lib/comments';
import { getMovie } from '@/lib/movies';

export async function GET(request: NextRequest) {
  const movieSlug = request.nextUrl.searchParams.get('movie');
  if (!movieSlug) {
    return NextResponse.json({ error: 'movie is required' }, { status: 400 });
  }

  const items = await getComments(movieSlug);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const movieSlug: string | undefined = body?.movieSlug;
  const side: string | undefined = body?.side;
  const authorName: string | undefined = body?.authorName;
  const text: string | undefined = body?.body;
  const imageUrl: string | undefined = body?.imageUrl;
  const thumbnailUrl: string | undefined = body?.thumbnailUrl;

  if (!movieSlug || !getMovie(movieSlug)) {
    return NextResponse.json({ error: 'Unknown movie' }, { status: 400 });
  }
  if (side !== 'hot' && side !== 'not') {
    return NextResponse.json({ error: 'side must be "hot" or "not"' }, { status: 400 });
  }
  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('comments')
    .insert({
      movie_slug: movieSlug,
      side,
      author_name: authorName?.trim() || 'Anonymous fan',
      body: text.trim().slice(0, 1000),
      image_url: imageUrl || null,
      thumbnail_url: thumbnailUrl || null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }

  await invalidateCommentsCache(movieSlug);

  return NextResponse.json({ id: data.id });
}
