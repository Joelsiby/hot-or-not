import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { invalidateCommentsCache } from '@/lib/comments';
import { BASE_PRICE_PAISE } from '@/lib/constants';

// NOTE: no payment is actually collected yet — same deliberate placeholder
// as posting (see app/api/comments/route.ts). Confirming the upvote modal
// just writes the base price straight onto the comment's running total via
// increment_comment_upvote(). Don't ship this to a public, adversarial
// audience without wiring a real charge to this — right now anyone can
// upvote for free by hitting this route directly.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const commentId: string | undefined = body?.commentId;
  const movieSlug: string | undefined = body?.movieSlug;

  if (!commentId || !movieSlug) {
    return NextResponse.json({ error: 'commentId and movieSlug are required' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data: comment } = await supabase
    .from('comments')
    .select('id')
    .eq('id', commentId)
    .maybeSingle();

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const { error } = await supabase.rpc('increment_comment_upvote', {
    p_comment_id: commentId,
    p_amount_paise: BASE_PRICE_PAISE,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to record upvote' }, { status: 500 });
  }

  await invalidateCommentsCache(movieSlug);

  return NextResponse.json({ ok: true });
}
