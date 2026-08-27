'use client';

import { useState } from 'react';

interface HoverImageProps {
  thumbnailUrl: string;
  fullUrl: string;
  alt: string;
}

// Only the tiny inline thumbnail loads by default. The full-size image
// isn't mounted (so the browser doesn't fetch it) until the thumbnail is
// hovered, when it appears enlarged in a floating preview.
export function HoverImage({ thumbnailUrl, fullUrl, alt }: HoverImageProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative inline-block shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={thumbnailUrl}
        alt={alt}
        className="size-14 rounded-lg object-cover border border-border/60 cursor-zoom-in"
      />
      {hovered && (
        <div className="absolute z-50 bottom-full left-0 mb-2 rounded-lg border border-border bg-popover shadow-xl p-1 animate-in fade-in zoom-in-95 duration-150">
          <img
            src={fullUrl}
            alt={alt}
            className="max-w-72 max-h-72 w-auto h-auto rounded-md object-contain"
          />
        </div>
      )}
    </div>
  );
}
