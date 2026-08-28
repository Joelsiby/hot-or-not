'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';

// Microsoft Clarity: session recordings, heatmaps, and rage/dead-click
// detection. A no-op with no project id set — same pattern as
// UmamiAnalytics, just via the official npm SDK instead of a <script> tag
// (Clarity's init() injects its own tracking script internally).
export function ClarityAnalytics() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  useEffect(() => {
    if (!projectId) return;
    Clarity.init(projectId);
  }, [projectId]);

  return null;
}
