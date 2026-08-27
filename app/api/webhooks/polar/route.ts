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
      .update({ status: 'paid' })
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
});
