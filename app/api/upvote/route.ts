import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { razorpay } from '@/lib/razorpay';
import { BASE_PRICE_PAISE } from '@/lib/constants';
import { detectCurrency, paiseToUsdCents } from '@/lib/currency';
import { rateLimitUpvoting, getClientIdentifier } from '@/lib/rate-limit';
import { limitRequestSize } from '@/lib/request-limiter';

// Creates a Razorpay order for one upvote. The actual upvote isn't applied
// here — that only happens once app/api/razorpay/verify/route.ts confirms
// the payment signature after checkout completes. UPI, cards, netbanking,
// and wallets are all offered automatically by Razorpay's standard
// Checkout — nothing here restricts which methods show.
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
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
        },
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

  // Determined server-side from the request's own geo header — never
  // trust a client-supplied currency for what actually gets charged.
  // amountPaise (the ranking value written to comments) never changes;
  // only what Razorpay bills the visitor does.
  const currency = detectCurrency(request.headers.get('x-vercel-ip-country'));
  const chargeAmount = currency === 'USD' ? paiseToUsdCents(amountPaise) : amountPaise;

  let order;
  try {
    order = await razorpay.orders.create({
      amount: chargeAmount,
      currency,
      // Razorpay caps receipt at 56 chars — the full UUID + prefix + full
      // timestamp ran over that by one, so this only keeps the comment
      // id's last 12 chars plus a base36 timestamp for uniqueness.
      receipt: `uv_${sanitizedCommentId.slice(-12)}_${Date.now().toString(36)}`,
      notes: { commentId: sanitizedCommentId, movieSlug: sanitizedMovieSlug },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 });
  }

  const { error } = await supabase.from('upvote_payments').insert({
    comment_id: sanitizedCommentId,
    movie_slug: sanitizedMovieSlug,
    amount_paise: amountPaise,
    charged_currency: currency,
    charged_amount_minor: chargeAmount,
    razorpay_order_id: order.id,
    status: 'pending',
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to record upvote' }, { status: 500 });
  }

  return NextResponse.json(
    {
      orderId: order.id,
      amountPaise: chargeAmount,
      currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    },
    {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.reset.toString(),
      },
    }
  );
}
