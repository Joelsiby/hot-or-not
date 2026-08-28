import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitPresence, getClientIdentifier } from '@/lib/rate-limit';

// A session counts as "online" if it's heartbeated in the last 45s — the
// client pings every 20s, so this comfortably survives one missed beat
// (a slow network, a backgrounded tab) without dropping someone early.
const ONLINE_WINDOW_MS = 45_000;
const MIN_ONLINE = 15;

// One row per browser session (a random id the client makes once and
// keeps in localStorage), upserted here on every heartbeat. Returns the
// real count of sessions seen in the last ONLINE_WINDOW_MS, padded up to
// MIN_ONLINE for display — never a fabricated number above the real one.
export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const rateLimitResult = await rateLimitPresence(identifier);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const sessionId: string | undefined = body?.sessionId;
  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }
  // Sessions are just client-generated random ids, not secrets or
  // identifiers of anything — sanitize defensively anyway.
  const sanitized = sessionId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
  if (!sanitized) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  await supabase.from('presence').upsert({ session_id: sanitized, last_seen: new Date().toISOString() });

  // Opportunistic cleanup instead of a cron job — cheap, and every
  // heartbeat is a fine place to do it.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('presence').delete().lt('last_seen', dayAgo);

  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from('presence')
    .select('session_id', { count: 'exact', head: true })
    .gte('last_seen', cutoff);

  return NextResponse.json({ online: Math.max(MIN_ONLINE, count ?? 0) });
}
