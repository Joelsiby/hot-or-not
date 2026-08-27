'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface HoverImageProps {
  thumbnailUrl: string;
  fullUrl: string;
  alt: string;
  // Overrides for the inline thumbnail's box/image classes — defaults
  // match the original size-14 rounded-lg "contain" thumbnail used for
  // comment images. Pass e.g. a smaller size-8 rounded-full + object-cover
  // pair for a circular avatar (see app/page.tsx's movie poster).
  thumbnailClassName?: string;
  thumbnailImgClassName?: string;
}

const PREVIEW_MAX_PX = 448; // ~28rem ceiling, clamped down to fit the viewport below that
const VIEWPORT_MARGIN = 12;

interface PreviewPlacement {
  left: number;
  top: number;
  direction: 'above' | 'below';
  maxSize: number;
}

// Only the tiny inline thumbnail loads by default. The full-size image
// isn't mounted (so the browser doesn't fetch it) until the thumbnail is
// hovered, when it rises up above the page in a floating preview that
// tilts toward the cursor as it moves over the thumbnail — a light 3D
// wobble rather than a flat popup.
//
// The preview is portaled to <body> instead of rendered inline — the card
// it lives in has `overflow-hidden` baked into ui/card.tsx, which would
// otherwise clip anything positioned outside the card's own box. Position
// and max size are computed from the live viewport on every hover, so the
// preview can never run off a small (mobile) screen: it's capped to fit
// horizontally, and flips to open downward instead of upward when there
// isn't enough room above the thumbnail.
export function HoverImage({
  thumbnailUrl,
  fullUrl,
  alt,
  thumbnailClassName,
  thumbnailImgClassName,
}: HoverImageProps) {
  const [hovered, setHovered] = useState(false);
  const [placement, setPlacement] = useState<PreviewPlacement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxSize = Math.min(PREVIEW_MAX_PX, vw - VIEWPORT_MARGIN * 2, vh - VIEWPORT_MARGIN * 2);
    const half = maxSize / 2;

    const centerX = rect.left + rect.width / 2;
    const left = Math.min(Math.max(centerX, half + VIEWPORT_MARGIN), vw - half - VIEWPORT_MARGIN);

    const fitsAbove = rect.top - maxSize - VIEWPORT_MARGIN > 0;
    const direction: PreviewPlacement['direction'] = fitsAbove ? 'above' : 'below';
    const top = fitsAbove ? rect.top - 12 : rect.bottom + 12;

    setPlacement({ left, top, direction, maxSize });
    setHovered(true);
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    // -0.5..0.5 across the thumbnail, however small it is — plenty of
    // signal for a subtle tilt even though the pointer never touches the
    // (pointer-events-none) preview itself.
    setTilt({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  };

  const handleLeave = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={wrapperRef}
      className="group relative inline-block shrink-0"
      onMouseEnter={handleEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden border border-border/60 bg-muted transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg',
          thumbnailClassName ?? 'size-14 rounded-lg'
        )}
      >
        <img
          src={thumbnailUrl}
          alt={alt}
          className={cn('size-full cursor-zoom-in', thumbnailImgClassName ?? 'object-contain')}
        />
      </div>
      {hovered &&
        placement &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className={cn(
              'pointer-events-none fixed z-50 -translate-x-1/2 animate-in fade-in zoom-in-90 duration-200 ease-out [perspective:500px]',
              placement.direction === 'above'
                ? '-translate-y-full slide-in-from-bottom-3'
                : 'slide-in-from-top-3'
            )}
            style={{ top: placement.top, left: placement.left }}
          >
            <img
              src={fullUrl}
              alt={alt}
              className="w-auto h-auto rounded-xl border border-border/60 bg-popover object-contain p-1 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.45)] transition-transform duration-150 ease-out will-change-transform"
              style={{
                maxWidth: placement.maxSize,
                maxHeight: placement.maxSize,
                transform: `rotateX(${tilt.y * -16}deg) rotateY(${tilt.x * 16}deg) translate3d(${tilt.x * 10}px, ${tilt.y * 10}px, 0)`,
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
