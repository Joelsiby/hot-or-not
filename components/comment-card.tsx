'use client';

import { useState } from 'react';
import { ArrowUp, Loader2, Flame, Snowflake } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HoverImage } from '@/components/hover-image';
import { UpvoteConfirmModal } from '@/components/upvote-confirm-modal';
import { BASE_PRICE_PAISE, formatINR } from '@/lib/constants';
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
  const [showUpvoteConfirm, setShowUpvoteConfirm] = useState(false);
  const [upvoteAmount, setUpvoteAmount] = useState(BASE_PRICE_PAISE);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const isHot = comment.side === 'hot';

  const openUpvoteConfirm = () => {
    setUpvoteAmount(BASE_PRICE_PAISE);
    setShowUpvoteConfirm(true);
  };

  const confirmUpvote = async () => {
    setIsUpvoting(true);
    try {
      const res = await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: comment.id,
          movieSlug: comment.movieSlug,
          amountPaise: upvoteAmount,
        }),
      });
      if (res.ok) {
        setShowUpvoteConfirm(false);
        onUpvoted();
      }
    } catch {
      // swallow — modal just stays open so the user can retry
    } finally {
      setIsUpvoting(false);
    }
  };

  return (
    <Card
      className={cn(
        'p-3 border-l-4',
        isHot ? 'border-l-red-500 bg-red-500/5' : 'border-l-sky-500 bg-sky-500/5',
        topPaid &&
          (isHot
            ? 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
            : 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]')
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
                    ? 'bg-red-500 text-white'
                    : 'bg-blue-500 text-white'
                  : isHot
                    ? 'bg-red-500/10 text-red-600'
                    : 'bg-sky-500/10 text-sky-600'
              )}
            >
              {rank}
            </div>
            <Avatar size="sm">
              <AvatarFallback className={cn(isHot ? 'text-red-600' : 'text-sky-600')}>
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
                isHot ? 'text-red-600' : 'text-sky-600'
              )}
            >
              {formatINR(comment.amountPaise)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
            {comment.body}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
            <span className={cn('inline-flex items-center gap-1 font-medium', isHot ? 'text-red-600' : 'text-sky-600')}>
              {isHot ? <Flame className="size-3" /> : <Snowflake className="size-3" />}
              {isHot ? 'Hot' : 'Not'}
            </span>
            <span aria-hidden>·</span>
            <span suppressHydrationWarning>{timeAgo(comment.createdAt)}</span>
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={openUpvoteConfirm}
              disabled={isUpvoting}
              className="inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors disabled:opacity-50"
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
        onConfirm={confirmUpvote}
      />
    </Card>
  );
}
