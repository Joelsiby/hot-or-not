'use client';

import { useState } from 'react';
import { CommentCard } from '@/components/comment-card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import type { Comment } from '@/lib/comments-data';

const PAGE_SIZE = 10;

interface CommentFeedProps {
  comments: Comment[];
  onUpvoted: () => void;
}

// One merged feed for both sides, ranked by amount raised (then recency) —
// Love It and Hate It takes sit in the same rows, distinguished only by color, with
// whichever comment has raised the most glowing at the top. Paginated 10
// at a time; rank numbers stay global (page 2 starts at #11), not reset
// per page.
export function CommentFeed({ comments, onUpvoted }: CommentFeedProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No takes yet — be the first to post one.
      </p>
    );
  }

  const totalPages = Math.ceil(comments.length / PAGE_SIZE);
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageComments = comments.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div>
      <div className="space-y-3">
        {pageComments.map((comment, i) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            rank={startIndex + i + 1}
            topPaid={startIndex + i === 0 && comment.amountPaise > 0}
            onUpvoted={onUpvoted}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  isActive={p === page}
                  onClick={() => setCurrentPage(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
