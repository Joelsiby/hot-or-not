'use client';

import { useEffect, useState } from 'react';

const SESSION_STORAGE_KEY = 'hate-it-or-love-it:session-id';
const HEARTBEAT_MS = 20_000;
const MIN_ONLINE = 15;

function getOrCreateSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(SESSION_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // localStorage unavailable (private mode, etc.) — a session-only id
    // still lets this tab count itself, just without persisting across
    // reloads.
    return crypto.randomUUID();
  }
}

// Real presence, not a fabricated number: pings app/api/presence on
// mount and every HEARTBEAT_MS after, and shows whatever count comes
// back — which the API already floors at MIN_ONLINE server-side, so
// this only ever displays MIN_ONLINE or the real (higher) count, never
// something invented above it.
export function usePresence() {
  const [online, setOnline] = useState(MIN_ONLINE);

  useEffect(() => {
    let cancelled = false;
    const sessionId = getOrCreateSessionId();

    const beat = async () => {
      try {
        const res = await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.online === 'number') {
          setOnline(data.online);
        }
      } catch {
        // A missed heartbeat just means the badge keeps showing its last
        // known value — not worth surfacing an error over.
      }
    };

    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return online;
}
