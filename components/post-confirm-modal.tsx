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
import { cn } from '@/lib/utils';
import type { Side } from '@/lib/comments-data';

interface PostConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: Side;
  body: string;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function PostConfirmModal({ open, onOpenChange, side, body, isSubmitting, onConfirm }: PostConfirmModalProps) {
  const [agreed, setAgreed] = useState(false);
  const isHot = side === 'hot';

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
            Check what you&apos;re posting, then agree to the Terms of Service to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-muted p-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Posting as
            </div>
            <div
              className={cn(
                'mt-1 text-lg font-bold',
                isHot ? 'text-orange-600' : 'text-sky-600'
              )}
            >
              {isHot ? '🔥 Hot' : '❄️ Not'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Cost</div>
            <div className="mt-1 text-lg font-bold">Free</div>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground line-clamp-3">&ldquo;{body}&rdquo;</p>

        <p className="mt-4 text-sm text-muted-foreground">
          Your take goes live immediately and stays visible to everyone. Anyone can pay ₹100 to
          upvote it and push it up the feed.
        </p>

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

        <Link href="/rules" target="_blank" className="mt-2 inline-block text-xs text-muted-foreground underline underline-offset-2">
          Rules
        </Link>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!agreed || isSubmitting}>
            {isSubmitting ? 'Posting…' : `Post ${isHot ? 'Hot' : 'Not'} take`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
