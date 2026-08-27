'use client';

import { useState } from 'react';
import { ArrowUp, Loader2, Flame, Snowflake } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HoverImage } from '@/components/hover-image';
import { UpvoteConfirmModal } from '@/components/upvote-confirm-modal';
import { formatINR } from '@/lib/constants';
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

export function CommentCard({ comment, rank, topPaid, onUpvoted }: CommentCardProps) {
  const [showUpvoteConfirm, setShowUpvoteConfirm] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const isHot = comment.side === 'hot';

  const confirmUpvote = async () => {
    setIsUpvoting(true);
    try {
      const res = await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment.id, movieSlug: comment.movieSlug }),
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
        isHot ? 'border-l-orange-500 bg-orange-500/5' : 'border-l-sky-500 bg-sky-500/5',
        topPaid && 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.45)]'
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            'shrink-0 size-6 rounded-full flex items-center justify-center text-[11px] font-bold',
            topPaid
              ? 'bg-amber-400 text-amber-950'
              : isHot
                ? 'bg-orange-500/10 text-orange-600'
                : 'bg-sky-500/10 text-sky-600'
          )}
        >
          {rank}
        </div>
        <Avatar size="sm" className="shrink-0">
          <AvatarFallback className={cn(isHot ? 'text-orange-600' : 'text-sky-600')}>
            {comment.authorName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{comment.authorName}</span>
            {isHot ? (
              <Flame className="size-3.5 text-orange-600" />
            ) : (
              <Snowflake className="size-3.5 text-sky-600" />
            )}
            <span className="text-xs text-muted-foreground" suppressHydrationWarning>
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">
            {comment.body}
          </p>
          {comment.imageUrl && comment.thumbnailUrl && (
            <div className="mt-2">
              <HoverImage
                thumbnailUrl={comment.thumbnailUrl}
                fullUrl={comment.imageUrl}
                alt={`Image from ${comment.authorName}`}
              />
            </div>
          )}
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowUpvoteConfirm(true)}
              disabled={isUpvoting}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50',
                isHot
                  ? 'border-orange-500/30 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
                  : 'border-sky-500/30 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20'
              )}
            >
              {isUpvoting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ArrowUp className="size-3.5" />
              )}
              {comment.upvotes}
            </button>
            <span className="text-xs text-muted-foreground">raised {formatINR(comment.amountPaise)}</span>
          </div>
        </div>
      </div>

      <UpvoteConfirmModal
        open={showUpvoteConfirm}
        onOpenChange={setShowUpvoteConfirm}
        comment={comment}
        isSubmitting={isUpvoting}
        onConfirm={confirmUpvote}
      />
    </Card>
  );
}
