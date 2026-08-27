import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getComments, invalidateCommentsCache } from '@/lib/comments';
import { getMovie } from '@/lib/movies';
import { BASE_PRICE_PAISE } from '@/lib/constants';

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
  const amountPaiseInput: unknown = body?.amountPaise;

  if (!movieSlug || !getMovie(movieSlug)) {
    return NextResponse.json({ error: 'Unknown movie' }, { status: 400 });
  }
  if (side !== 'hot' && side !== 'not') {
    return NextResponse.json({ error: 'side must be "hot" or "not"' }, { status: 400 });
  }
  if (!authorName || !authorName.trim()) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }
  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
  }

  // NOTE: no payment is actually collected yet — the chosen claim price is
  // trusted from the client and written straight to amount_paise. This is
  // a deliberate placeholder ("claim a spot" like outbid.lol, base price
  // fixed at ₹20) until real checkout is wired in for posting; anyone can
  // currently claim any rank for free. Don't ship this to a public,
  // adversarial audience without hooking a real charge to this amount.
  const amountPaise =
    typeof amountPaiseInput === 'number' && Number.isFinite(amountPaiseInput) && amountPaiseInput > 0
      ? Math.round(amountPaiseInput / BASE_PRICE_PAISE) * BASE_PRICE_PAISE
      : 0;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('comments')
    .insert({
      movie_slug: movieSlug,
      side,
      author_name: authorName.trim().slice(0, 40),
      body: text.trim().slice(0, 1000),
      image_url: imageUrl || null,
      thumbnail_url: thumbnailUrl || null,
      amount_paise: amountPaise,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }

  await invalidateCommentsCache(movieSlug);

  return NextResponse.json({ id: data.id });
}
