import { Webhooks } from '@polar-sh/nextjs';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { invalidateCommentsCache } from '@/lib/comments';

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onOrderPaid: async ({ data: order }) => {
    const metadata = order.metadata as {
      commentId?: string;
      movieSlug?: string;
      amountPaise?: string;
    };
    if (!metadata.commentId || !metadata.movieSlug || !metadata.amountPaise) return;

    const supabase = getSupabaseServerClient();
    const amountPaise = Number(metadata.amountPaise);

    const { data: payment } = await supabase
      .from('upvote_payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('polar_checkout_id', order.checkoutId ?? '')
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    // Already processed this checkout (webhook retry) — don't double-count.
    if (!payment) return;

    await supabase.rpc('increment_comment_upvote', {
      p_comment_id: metadata.commentId,
      p_amount_paise: amountPaise,
    });

    await invalidateCommentsCache(metadata.movieSlug);
  },
  // Keeps the ledger accurate for checkouts that never complete — an
  // abandoned/expired session, or a card decline — so `upvote_payments`
  // doesn't sit at "pending" forever for a payment that's never coming.
  onCheckoutUpdated: async ({ data: checkout }) => {
    if (checkout.status !== 'expired' && checkout.status !== 'failed') return;

    const supabase = getSupabaseServerClient();
    await supabase
      .from('upvote_payments')
      .update({ status: 'failed' })
      .eq('polar_checkout_id', checkout.id)
      .eq('status', 'pending');
  },
});
