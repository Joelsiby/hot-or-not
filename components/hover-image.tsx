'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface HoverImageProps {
  thumbnailUrl: string;
  fullUrl: string;
  alt: string;
}

// Only the tiny inline thumbnail loads by default. The full-size image
// isn't mounted (so the browser doesn't fetch it) until the thumbnail is
// hovered, when it rises up above the page in a floating preview.
//
// The preview is portaled to <body> instead of rendered inline — the card
// it lives in has `overflow-hidden` baked into ui/card.tsx, which would
// otherwise clip anything positioned outside the card's own box.
export function HoverImage({ thumbnailUrl, fullUrl, alt }: HoverImageProps) {
  const [hovered, setHovered] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (rect) setAnchor({ top: rect.top, left: rect.left + rect.width / 2 });
    setHovered(true);
  };

  return (
    <div
      ref={wrapperRef}
      className="group relative inline-block shrink-0"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg">
        <img
          src={thumbnailUrl}
          alt={alt}
          className="size-full object-contain cursor-zoom-in"
        />
      </div>
      {hovered &&
        anchor &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-90 slide-in-from-bottom-3 duration-200 ease-out"
            style={{ top: anchor.top - 12, left: anchor.left }}
          >
            <img
              src={fullUrl}
              alt={alt}
              className="max-w-72 max-h-72 w-auto h-auto rounded-xl border border-border/60 bg-popover object-contain p-1 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.45)]"
            />
          </div>,
          document.body
        )}
    </div>
  );
}
