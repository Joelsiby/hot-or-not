import { createClient } from '@supabase/supabase-js';

// Browser-safe client using the anon/publishable key — only ever reads
// public tables (movies, controversies) via Realtime. Never use this for
// comments/upvote_payments; those stay server-only via lib/supabase/server.ts.
//
// Both the URL and the anon key must carry the NEXT_PUBLIC_ prefix to reach
// the browser bundle, regardless of which naming you use for the
// server-only pair.
let cachedClient: ReturnType<typeof createClient> | null | undefined;

export function getSupabaseBrowserClient() {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return cachedClient;
}
