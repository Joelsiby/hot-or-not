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
// hovered, when it rises up above the page in a floating preview that
// tilts toward the cursor as it moves over the thumbnail — a light 3D
// wobble rather than a flat popup.
//
// The preview is portaled to <body> instead of rendered inline — the card
// it lives in has `overflow-hidden` baked into ui/card.tsx, which would
// otherwise clip anything positioned outside the card's own box.
export function HoverImage({ thumbnailUrl, fullUrl, alt }: HoverImageProps) {
  const [hovered, setHovered] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (rect) setAnchor({ top: rect.top, left: rect.left + rect.width / 2 });
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
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-90 slide-in-from-bottom-3 duration-200 ease-out [perspective:500px]"
            style={{ top: anchor.top - 12, left: anchor.left }}
          >
            <img
              src={fullUrl}
              alt={alt}
              className="max-w-[26rem] max-h-[26rem] w-auto h-auto rounded-xl border border-border/60 bg-popover object-contain p-1 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.45)] transition-transform duration-150 ease-out will-change-transform"
              style={{
                transform: `rotateX(${tilt.y * -16}deg) rotateY(${tilt.x * 16}deg) translate3d(${tilt.x * 10}px, ${tilt.y * 10}px, 0)`,
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
