import { NextRequest, NextResponse } from 'next/server';
import { polar } from '@/lib/polar';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { BASE_PRICE_PAISE } from '@/lib/constants';

// Every upvote costs the fixed base price (₹100) — there's no bidding here,
// just "pay to push this comment up." Statement descriptor: set it in your
// Polar dashboard under Organization Settings > Statement Descriptor to
// something like "HOTORNOT" so customers don't dispute the charge.

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const commentId: string | undefined = body?.commentId;
  const movieSlug: string | undefined = body?.movieSlug;

  if (!commentId || !movieSlug) {
    return NextResponse.json({ error: 'commentId and movieSlug are required' }, { status: 400 });
  }

  const productId = process.env.POLAR_PRODUCT_ID;
  if (!productId) {
    return NextResponse.json({ error: 'Polar product is not configured' }, { status: 500 });
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

  const checkout = await polar.checkouts.create({
    products: [productId],
    prices: {
      [productId]: [{ amountType: 'fixed', priceAmount: BASE_PRICE_PAISE, priceCurrency: 'inr' }],
    },
    successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/?movie=${movieSlug}&upvoted=1`,
    metadata: {
      commentId,
      movieSlug,
      amountPaise: String(BASE_PRICE_PAISE),
    },
  });

  const { error } = await supabase.from('upvote_payments').insert({
    comment_id: commentId,
    movie_slug: movieSlug,
    amount_paise: BASE_PRICE_PAISE,
    polar_checkout_id: checkout.id,
    status: 'pending',
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to record upvote' }, { status: 500 });
  }

  return NextResponse.json({ checkoutUrl: checkout.url });
}
