import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { invalidateCommentsCache } from '@/lib/comments';

// The Checkout.js success handler runs entirely in the browser — it can
// be spoofed, so its callback is never trusted on its own. This route
// recomputes Razorpay's HMAC-SHA256 signature server-side with the secret
// key and only credits the upvote if it matches. The comment/movie/amount
// come from the pending upvote_payments row (written when the order was
// created), never from this request's body, so a tampered payload can't
// redirect the credit to a different comment or amount.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const orderId: string | undefined = body?.razorpay_order_id;
  const paymentId: string | undefined = body?.razorpay_payment_id;
  const signature: string | undefined = body?.razorpay_signature;

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 500 });
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(signature);
  const isValid = expected.length === received.length && crypto.timingSafeEqual(expected, received);

  if (!isValid) {
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  // status = 'pending' guard: only the first verify call for a given order
  // can flip it to 'paid' and credit the upvote — a page refresh replaying
  // the same success callback, or Checkout.js retrying, can't double-count.
  const { data: payment } = await supabase
    .from('upvote_payments')
    .update({ status: 'paid', razorpay_payment_id: paymentId })
    .eq('razorpay_order_id', orderId)
    .eq('status', 'pending')
    .select('comment_id, movie_slug, amount_paise')
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: 'Order not found or already processed' }, { status: 404 });
  }

  const { error } = await supabase.rpc('increment_comment_upvote', {
    p_comment_id: payment.comment_id,
    p_amount_paise: payment.amount_paise,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to record upvote' }, { status: 500 });
  }

  await invalidateCommentsCache(payment.movie_slug);

  return NextResponse.json({ ok: true });
}
