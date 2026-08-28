import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getComments } from '@/lib/comments';
import { getMovie } from '@/lib/movies';
import { razorpay } from '@/lib/razorpay';
import { BASE_PRICE_PAISE } from '@/lib/constants';
import { detectCurrency, paiseToUsdCents } from '@/lib/currency';
import { rateLimitCommentPosting, getClientIdentifier } from '@/lib/rate-limit';
import { limitRequestSize } from '@/lib/request-limiter';

export async function GET(request: NextRequest) {
  const movieSlug = request.nextUrl.searchParams.get('movie');
  if (!movieSlug) {
    return NextResponse.json({ error: 'movie is required' }, { status: 400 });
  }

  const items = await getComments(movieSlug);
  return NextResponse.json({ items });
}

// Posting is paid, same as upvoting: this creates a Razorpay order and
// holds the comment's content in comment_payments — the comment itself
// isn't written to `comments` until app/api/razorpay/verify/route.ts
// confirms the payment signature.
export async function POST(request: NextRequest) {
  // Check request size limit
  const sizeLimitError = limitRequestSize(request);
  if (sizeLimitError) return sizeLimitError;

  // Rate limiting based on robust client identification
  const identifier = getClientIdentifier(request);

  const rateLimitResult = await rateLimitCommentPosting(identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'Too many comments. Please try again later.',
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

  // Sanitize inputs to prevent XSS
  const sanitizedName = authorName.trim().replace(/[<>]/g, '').slice(0, 40);
  const sanitizedText = text.trim().replace(/[<>]/g, '').slice(0, 1000);

  if (sanitizedName.length === 0) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }
  if (sanitizedText.length === 0) {
    return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
  }

  // Base price is the floor — someone claiming a higher rank pays a whole
  // multiple of it, same rounding rule as an upvote.
  const amountPaise =
    typeof amountPaiseInput === 'number' && Number.isFinite(amountPaiseInput) && amountPaiseInput > 0
      ? Math.max(BASE_PRICE_PAISE, Math.round(amountPaiseInput / BASE_PRICE_PAISE) * BASE_PRICE_PAISE)
      : BASE_PRICE_PAISE;

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
      // Razorpay caps receipt at 56 chars.
      receipt: `post_${movieSlug.slice(0, 20)}_${Date.now().toString(36)}`,
      notes: { movieSlug, side },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('comment_payments').insert({
    movie_slug: movieSlug,
    side,
    author_name: sanitizedName,
    body: sanitizedText,
    image_url: imageUrl || null,
    thumbnail_url: thumbnailUrl || null,
    amount_paise: amountPaise,
    charged_currency: currency,
    charged_amount_minor: chargeAmount,
    razorpay_order_id: order.id,
    status: 'pending',
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 });
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
