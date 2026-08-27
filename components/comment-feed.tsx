'use client';

import { CommentCard } from '@/components/comment-card';
import type { Comment } from '@/lib/comments-data';

interface CommentFeedProps {
  comments: Comment[];
  onUpvoted: () => void;
}

// One merged feed for both sides, ranked by amount raised (then recency) —
// Hot and Not takes sit in the same rows, distinguished only by color, with
// whichever comment has raised the most glowing at the top.
export function CommentFeed({ comments, onUpvoted }: CommentFeedProps) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No takes yet — be the first to post one.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment, i) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          rank={i + 1}
          topPaid={i === 0 && comment.amountPaise > 0}
          onUpvoted={onUpvoted}
        />
      ))}
    </div>
  );
}
