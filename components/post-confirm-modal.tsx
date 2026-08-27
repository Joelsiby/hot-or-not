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
import { Input } from '@/components/ui/input';
import { PriceStepper } from '@/components/price-stepper';
import { cn } from '@/lib/utils';
import type { Comment, Side } from '@/lib/comments-data';

interface PostConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: Side;
  onSideChange: (side: Side) => void;
  body: string;
  username: string;
  onUsernameChange: (name: string) => void;
  amountPaise: number;
  onAmountChange: (amountPaise: number) => void;
  comments: Comment[];
  isSubmitting: boolean;
  onConfirm: () => void;
}

// Predicted rank in the merged feed if this comment posted at `amountPaise`
// right now — same "claim a spot" logic as outbid.lol's bidding, just with
// a fixed ₹20 base instead of an open $1 minimum.
function previewRank(comments: Comment[], amountPaise: number) {
  return comments.filter((c) => c.amountPaise > amountPaise).length + 1;
}

export function PostConfirmModal({
  open,
  onOpenChange,
  side,
  onSideChange,
  body,
  username,
  onUsernameChange,
  amountPaise,
  onAmountChange,
  comments,
  isSubmitting,
  onConfirm,
}: PostConfirmModalProps) {
  const [agreed, setAgreed] = useState(false);
  const isHot = side === 'hot';
  const rank = previewRank(comments, amountPaise);

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
          <DialogTitle>Confirm this take</DialogTitle>
          <DialogDescription>
            Check the rank and price, then agree to the Terms of Service to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex rounded-full bg-muted p-0.5">
          <button
            type="button"
            onClick={() => onSideChange('hot')}
            className={cn(
              'flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              isHot ? 'bg-red-500 text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            🔥 Hot
          </button>
          <button
            type="button"
            onClick={() => onSideChange('not')}
            className={cn(
              'flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              !isHot ? 'bg-sky-500 text-white' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            ❄️ Not
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-muted p-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rank</div>
            <div className="mt-1 text-lg font-bold">#{rank}</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Price</div>
            <PriceStepper amountPaise={amountPaise} onAmountChange={onAmountChange} className="mt-1" valueClassName="text-lg" />
          </div>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Base price is ₹20 — pay more to claim a higher spot. Someone else can still outbid you later.
        </p>

        <p className="mt-3 text-sm text-muted-foreground line-clamp-3">&ldquo;{body}&rdquo;</p>

        <Input
          placeholder="Your username"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          maxLength={40}
          className="mt-3"
        />

        <label className="mt-3 flex items-start gap-3 rounded-xl border border-border p-3 text-sm cursor-pointer">
          <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
          <span>
            I have read and agree to the{' '}
            <Link href="/terms" target="_blank" className="text-primary underline underline-offset-2">
              Terms of Service
            </Link>{' '}
            of hot-or-not
          </span>
        </label>

        <Link href="/rules" target="_blank" className="mt-2 inline-block text-xs text-muted-foreground underline underline-offset-2">
          Rules
        </Link>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!agreed || !username.trim() || isSubmitting}>
            {isSubmitting ? 'Posting…' : `Post at #${rank}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
