'use client';

import { useState } from 'react';
import { ArrowUp, Loader2, Zap, Flame } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HoverImage } from '@/components/hover-image';
import { UpvoteConfirmModal } from '@/components/upvote-confirm-modal';
import { loadRazorpayScript } from '@/lib/load-razorpay-script';
import { BASE_PRICE_PAISE } from '@/lib/constants';
import { useCurrency } from '@/components/currency-provider';
import { formatMoney } from '@/lib/currency';
import { cn } from '@/lib/utils';
import type { Comment } from '@/lib/comments-data';

interface CommentCardProps {
  comment: Comment;
  rank: number;
  topPaid?: boolean;
  onUpvoted: () => void;
}

function timeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const MAX_UPVOTE_PAISE = 100 * BASE_PRICE_PAISE; // ₹2,000 ceiling on the upvote stepper

export function CommentCard({ comment, rank, topPaid, onUpvoted }: CommentCardProps) {
  const currency = useCurrency();
  const [showUpvoteConfirm, setShowUpvoteConfirm] = useState(false);
  const [upvoteAmount, setUpvoteAmount] = useState(BASE_PRICE_PAISE);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const isHot = comment.side === 'hot';

  const openUpvoteConfirm = () => {
    setUpvoteAmount(BASE_PRICE_PAISE);
    setPaymentError(null);
    setShowUpvoteConfirm(true);
  };

  // Create the order, open Razorpay Checkout (UPI/cards/netbanking/wallets
  // all show automatically — nothing here restricts the method list), then
  // hand the result to the server-side verify route. The upvote is only
  // ever applied there, after the signature checks out — this handler
  // succeeding just means the popup ran, not that money moved.
  const confirmUpvote = async () => {
    setIsUpvoting(true);
    setPaymentError(null);
    try {
      const orderRes = await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: comment.id,
          movieSlug: comment.movieSlug,
          amountPaise: upvoteAmount,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setPaymentError(orderData.error || 'Failed to start checkout');
        setIsUpvoting(false);
        return;
      }
      if (!orderData.keyId) {
        setPaymentError('Payments aren’t configured yet');
        setIsUpvoting(false);
        return;
      }

      await loadRazorpayScript();

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'hate-it-or-love-it',
        description: `Upvote on ${comment.movieSlug}`,
        theme: { color: isHot ? '#0ea5e9' : '#ef4444' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            if (verifyRes.ok) {
              setShowUpvoteConfirm(false);
              onUpvoted();
            } else {
              const verifyData = await verifyRes.json().catch(() => null);
              setPaymentError(verifyData?.error || 'Payment could not be verified');
            }
          } finally {
            setIsUpvoting(false);
          }
        },
        modal: {
          ondismiss: () => setIsUpvoting(false),
        },
      });
      razorpay.open();
    } catch {
      setPaymentError('Something went wrong');
      setIsUpvoting(false);
    }
  };

  return (
    <Card
      className={cn(
        'p-3 border-l-4',
        isHot ? 'border-l-sky-500 bg-sky-500/5' : 'border-l-red-500 bg-red-500/5',
        topPaid &&
          (isHot
            ? 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
            : 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]')
      )}
    >
      <div className="flex gap-3">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-[11px] font-bold',
                topPaid
                  ? isHot
                    ? 'bg-blue-500 text-white'
                    : 'bg-red-500 text-white'
                  : isHot
                    ? 'bg-sky-500/10 text-sky-600'
                    : 'bg-red-500/10 text-red-600'
              )}
            >
              {rank}
            </div>
            <Avatar size="sm">
              <AvatarFallback className={cn(isHot ? 'text-sky-600' : 'text-red-600')}>
                {comment.authorName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          {comment.imageUrl && comment.thumbnailUrl && (
            <HoverImage
              thumbnailUrl={comment.thumbnailUrl}
              fullUrl={comment.imageUrl}
              alt={`Image from ${comment.authorName}`}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <span className="font-bold text-[15px] leading-snug truncate">{comment.authorName}</span>
            <span
              className={cn(
                'shrink-0 text-base sm:text-lg font-bold tabular-nums',
                isHot ? 'text-sky-600' : 'text-red-600'
              )}
            >
              {formatMoney(comment.amountPaise, currency)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
            {comment.body}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
            <span className={cn('inline-flex items-center gap-1 font-medium', isHot ? 'text-sky-600' : 'text-red-600')}>
              {isHot ? <Zap className="size-3" /> : <Flame className="size-3" />}
              {isHot ? 'Love it' : 'Hate it'}
            </span>
            <span aria-hidden>·</span>
            <span suppressHydrationWarning>{timeAgo(comment.createdAt)}</span>
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={openUpvoteConfirm}
              disabled={isUpvoting}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold transition-all disabled:opacity-50',
                isHot
                  ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 shadow-[0_0_8px_rgba(59,130,246,0.45)] hover:bg-sky-500/20 hover:shadow-[0_0_14px_rgba(59,130,246,0.65)]'
                  : 'border-red-500/30 bg-red-500/10 text-red-600 shadow-[0_0_8px_rgba(239,68,68,0.45)] hover:bg-red-500/20 hover:shadow-[0_0_14px_rgba(239,68,68,0.65)]'
              )}
            >
              {isUpvoting ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <ArrowUp className="size-3" />
              )}
              {comment.upvotes} upvotes
            </button>
          </div>
        </div>
      </div>

      <UpvoteConfirmModal
        open={showUpvoteConfirm}
        onOpenChange={setShowUpvoteConfirm}
        comment={comment}
        amountPaise={upvoteAmount}
        onAmountChange={(next) => setUpvoteAmount(Math.min(MAX_UPVOTE_PAISE, Math.max(BASE_PRICE_PAISE, next)))}
        isSubmitting={isUpvoting}
        error={paymentError}
        onConfirm={confirmUpvote}
      />
    </Card>
  );
}
