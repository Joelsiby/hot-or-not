'use client';

import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// "Trending" and "Latest activity" collapse by default on mobile only —
// expanded everywhere else. Starts expanded (matching SSR, same
// mismatch-avoidance pattern as useIsMobile itself) and only collapses
// once the mobile breakpoint is actually detected client-side. Once
// someone manually toggles it, their choice sticks regardless of any
// later resize.
export function useDefaultCollapsed() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(true);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    // Syncing to the client-only mobile detection is this effect's whole
    // purpose — isMobile itself only resolves after mount (see
    // useIsMobile), so there's no way to fold this into render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!touched) setOpen(!isMobile);
  }, [isMobile, touched]);

  const toggle = () => {
    setTouched(true);
    setOpen((o) => !o);
  };

  return { open, toggle };
}
