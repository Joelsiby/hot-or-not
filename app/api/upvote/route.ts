import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { invalidateCommentsCache } from '@/lib/comments';
import { BASE_PRICE_PAISE } from '@/lib/constants';
import { rateLimitUpvoting, getClientIdentifier } from '@/lib/rate-limit';
import { limitRequestSize } from '@/lib/request-limiter';

// NOTE: no payment is actually collected yet — same deliberate placeholder
// as posting (see app/api/comments/route.ts). Confirming the upvote modal
// just writes the base price straight onto the comment's running total via
// increment_comment_upvote(). Don't ship this to a public, adversarial
// audience without wiring a real charge to this — right now anyone can
// upvote for free by hitting this route directly.
export async function POST(request: NextRequest) {
  // Check request size limit
  const sizeLimitError = limitRequestSize(request);
  if (sizeLimitError) return sizeLimitError;

  // Rate limiting based on robust client identification
  const identifier = getClientIdentifier(request);
  
  const rateLimitResult = await rateLimitUpvoting(identifier);
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: 'Too many upvotes. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        }
      }
    );
  }

  const body = await request.json().catch(() => null);
  const commentId: string | undefined = body?.commentId;
  const movieSlug: string | undefined = body?.movieSlug;
  const amountPaiseInput: unknown = body?.amountPaise;

  if (!commentId || !movieSlug) {
    return NextResponse.json({ error: 'commentId and movieSlug are required' }, { status: 400 });
  }

  // Sanitize inputs to prevent injection attacks
  const sanitizedCommentId = commentId.replace(/[^a-f0-9-]/gi, '');
  const sanitizedMovieSlug = movieSlug.replace(/[^a-z0-9-]/gi, '');

  if (sanitizedCommentId !== commentId || sanitizedMovieSlug !== movieSlug) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // The upvote modal lets someone stack multiple ₹BASE_PRICE_PAISE units
  // in one confirm instead of clicking upvote repeatedly — always rounded
  // to a whole multiple of the base price, floor of one unit.
  const amountPaise =
    typeof amountPaiseInput === 'number' && Number.isFinite(amountPaiseInput) && amountPaiseInput > 0
      ? Math.max(BASE_PRICE_PAISE, Math.round(amountPaiseInput / BASE_PRICE_PAISE) * BASE_PRICE_PAISE)
      : BASE_PRICE_PAISE;

  const supabase = getSupabaseServerClient();

  const { data: comment } = await supabase
    .from('comments')
    .select('id')
    .eq('id', sanitizedCommentId)
    .maybeSingle();

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  const { error } = await supabase.rpc('increment_comment_upvote', {
    p_comment_id: sanitizedCommentId,
    p_amount_paise: amountPaise,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to record upvote' }, { status: 500 });
  }

  await invalidateCommentsCache(sanitizedMovieSlug);

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toString(),
      }
    }
  );
}
