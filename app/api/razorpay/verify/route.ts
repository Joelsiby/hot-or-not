import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { invalidateCommentsCache } from '@/lib/comments';

// The Checkout.js success handler runs entirely in the browser — it can
// be spoofed, so its callback is never trusted on its own. This route
// recomputes Razorpay's HMAC-SHA256 signature server-side with the secret
// key and only applies the payment if it matches.
//
// One order id can belong to either of two flows — an upvote on an
// existing comment, or a brand new comment that doesn't exist until this
// payment clears — so this checks upvote_payments first, then
// comment_payments. Either way, all the data that actually gets written
// (comment id / content / amount) comes from the pending DB row created
// when the order was made, never from this request's body, so a tampered
// payload can't redirect the credit or forge comment content.
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

  // status = 'pending' guard on both branches: only the first verify call
  // for a given order can flip it to 'paid' — a page refresh replaying the
  // same success callback, or Checkout.js retrying, can't double-count or
  // double-post.
  const { data: upvote } = await supabase
    .from('upvote_payments')
    .update({ status: 'paid', razorpay_payment_id: paymentId })
    .eq('razorpay_order_id', orderId)
    .eq('status', 'pending')
    .select('comment_id, movie_slug, amount_paise')
    .maybeSingle();

  if (upvote) {
    const { error } = await supabase.rpc('increment_comment_upvote', {
      p_comment_id: upvote.comment_id,
      p_amount_paise: upvote.amount_paise,
    });
    if (error) {
      return NextResponse.json({ error: 'Failed to record upvote' }, { status: 500 });
    }
    await invalidateCommentsCache(upvote.movie_slug);
    return NextResponse.json({ ok: true });
  }

  const { data: pendingComment } = await supabase
    .from('comment_payments')
    .update({ status: 'paid', razorpay_payment_id: paymentId })
    .eq('razorpay_order_id', orderId)
    .eq('status', 'pending')
    .select('movie_slug, side, author_name, body, image_url, thumbnail_url, amount_paise')
    .maybeSingle();

  if (!pendingComment) {
    return NextResponse.json({ error: 'Order not found or already processed' }, { status: 404 });
  }

  const { data: inserted, error } = await supabase
    .from('comments')
    .insert({
      movie_slug: pendingComment.movie_slug,
      side: pendingComment.side,
      author_name: pendingComment.author_name,
      body: pendingComment.body,
      image_url: pendingComment.image_url,
      thumbnail_url: pendingComment.thumbnail_url,
      amount_paise: pendingComment.amount_paise,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }

  await supabase.from('comment_payments').update({ comment_id: inserted.id }).eq('razorpay_order_id', orderId);
  await invalidateCommentsCache(pendingComment.movie_slug);

  return NextResponse.json({ ok: true, id: inserted.id });
}
