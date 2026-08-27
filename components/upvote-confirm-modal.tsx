'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { BASE_PRICE_PAISE, formatINR } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Comment } from '@/lib/comments-data';

interface UpvoteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comment: Comment;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function UpvoteConfirmModal({ open, onOpenChange, comment, isSubmitting, onConfirm }: UpvoteConfirmModalProps) {
  const [agreed, setAgreed] = useState(false);
  const isHot = comment.side === 'hot';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setAgreed(false);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm this upvote</DialogTitle>
          <DialogDescription>
            Every upvote costs the base price and pushes this take up the feed.
          </DialogDescription>
        </DialogHeader>

        <p className="mt-4 text-sm text-muted-foreground line-clamp-3">&ldquo;{comment.body}&rdquo;</p>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-muted p-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Cost</div>
            <div className={cn('mt-1 text-lg font-bold', isHot ? 'text-orange-600' : 'text-sky-600')}>
              {formatINR(BASE_PRICE_PAISE)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              New total
            </div>
            <div className="mt-1 text-lg font-bold">{formatINR(comment.amountPaise + BASE_PRICE_PAISE)}</div>
          </div>
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-border p-3 text-sm cursor-pointer">
          <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
          <span>
            I have read and agree to the{' '}
            <Link href="/terms" target="_blank" className="text-primary underline underline-offset-2">
              Terms of Service
            </Link>{' '}
            of hot-or-not
          </span>
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!agreed || isSubmitting}>
            {isSubmitting ? 'Upvoting…' : `Upvote for ${formatINR(BASE_PRICE_PAISE)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
