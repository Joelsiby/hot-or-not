'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostConfirmModal } from '@/components/post-confirm-modal';
import { loadRazorpayScript } from '@/lib/load-razorpay-script';
import { BASE_PRICE_PAISE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Comment, Side } from '@/lib/comments-data';

const USERNAME_STORAGE_KEY = 'hot-or-not:username';
const MAX_CLAIM_PAISE = 100 * BASE_PRICE_PAISE; // ₹2,000 ceiling on the price stepper
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB, checked on the original file before resizing

function getSavedUsername() {
  try {
    return localStorage.getItem(USERNAME_STORAGE_KEY) ?? '';
  } catch {
    // localStorage unavailable (private mode, etc.) — just skip prefill
    return '';
  }
}

interface CommentComposerProps {
  movieSlug: string;
  comments: Comment[];
  onPosted: () => void;
}

// Resizes an image file down to `maxDimension` on its longest side and
// returns a JPEG data URL — keeps both the thumbnail and the full upload
// small instead of shipping whatever the camera produced.
function resizeImage(file: File, maxDimension: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas unsupported'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// A single posting bar for the whole feed — pick Hot or Not, type a take,
// optionally attach an image, then confirm the claim price and username in
// the modal before it actually posts.
export function CommentComposer({ movieSlug, comments, onPosted }: CommentComposerProps) {
  const [side, setSide] = useState<Side>('hot');
  const [body, setBody] = useState('');
  // Remember the username on this browser so returning fans don't retype it.
  const [username, setUsername] = useState(getSavedUsername);
  const [amountPaise, setAmountPaise] = useState(BASE_PRICE_PAISE);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [fullDataUrl, setFullDataUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be under 5MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setError(null);
    const [thumb, full] = await Promise.all([
      resizeImage(file, 64, 0.6),
      resizeImage(file, 1600, 0.85),
    ]);
    setThumbnailUrl(thumb);
    setFullDataUrl(full);
  };

  const clearImage = () => {
    setThumbnailUrl(null);
    setFullDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openConfirm = () => {
    if (!body.trim()) {
      setError('Write something first');
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  // Posting is paid, same as upvoting: uploads the image (free — that's
  // just storage), creates a Razorpay order for the chosen claim price,
  // opens Checkout (UPI/cards/netbanking/wallets all show automatically),
  // then hands the result to the server-side verify route. The comment
  // itself is only written to the feed there, after the signature checks
  // out — this succeeding just means the popup ran, not that money moved.
  const submitComment = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      let imageUrl: string | null = null;
      if (fullDataUrl) {
        const uploadRes = await fetch('/api/comments/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: fullDataUrl }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error || 'Image upload failed');
          setIsSubmitting(false);
          return;
        }
        imageUrl = uploadData.url;
      }

      const orderRes = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieSlug,
          side,
          authorName: username,
          body,
          imageUrl,
          thumbnailUrl: imageUrl ? thumbnailUrl : null,
          amountPaise,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || 'Failed to start checkout');
        setIsSubmitting(false);
        return;
      }
      if (!orderData.keyId) {
        setError('Payments aren’t configured yet');
        setIsSubmitting(false);
        return;
      }

      await loadRazorpayScript();

      const razorpay = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'hate-or-hype',
        description: `${side === 'hot' ? 'Hype' : 'Hate'} take on ${movieSlug}`,
        theme: { color: side === 'hot' ? '#0ea5e9' : '#ef4444' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            if (verifyRes.ok) {
              try {
                localStorage.setItem(USERNAME_STORAGE_KEY, username.trim());
              } catch {
                // localStorage unavailable — not worth surfacing an error over
              }
              setBody('');
              setAmountPaise(BASE_PRICE_PAISE);
              clearImage();
              setShowConfirm(false);
              onPosted();
            } else {
              const verifyData = await verifyRes.json().catch(() => null);
              setError(verifyData?.error || 'Payment could not be verified');
            }
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setIsSubmitting(false),
        },
      });
      razorpay.open();
    } catch {
      setError('Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border p-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-muted p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setSide('hot')}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              side === 'hot'
                ? 'bg-sky-500 text-white'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            ⚡ Hype
          </button>
          <button
            type="button"
            onClick={() => setSide('not')}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              side === 'not'
                ? 'bg-red-500 text-white'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            🔥 Hate
          </button>
        </div>
        <input
          type="text"
          placeholder={
            side === 'hot' ? "What's making this a Hype take?" : "What's making this a Hate take?"
          }
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={280}
          onKeyDown={(e) => {
            if (e.key === 'Enter') openConfirm();
          }}
          className="order-3 w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground sm:order-none sm:min-w-0 sm:flex-1 sm:w-auto"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
        </Button>
        <Button size="sm" className="shrink-0" onClick={openConfirm}>
          Post
        </Button>
      </div>
      {thumbnailUrl && (
        <div className="relative inline-block mt-2 ml-1">
          <img
            src={thumbnailUrl}
            alt="Upload preview"
            className="size-14 rounded-lg object-cover border border-border"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-foreground text-background flex items-center justify-center"
          >
            <X className="size-2.5" />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-1.5 ml-1">{error}</p>}

      <PostConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        side={side}
        onSideChange={setSide}
        body={body}
        username={username}
        onUsernameChange={setUsername}
        amountPaise={amountPaise}
        onAmountChange={(next) =>
          setAmountPaise(Math.min(MAX_CLAIM_PAISE, Math.max(BASE_PRICE_PAISE, next)))
        }
        comments={comments}
        isSubmitting={isSubmitting}
        error={error}
        onConfirm={submitComment}
      />
    </div>
  );
}
