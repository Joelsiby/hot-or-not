import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { readLocalControversies } from '@/lib/local-controversy-data';

// Backs both the live feed's initial load and its no-Supabase-anon-key
// polling fallback (see components/live-controversies.tsx).
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('controversies')
      .select('id, title, summary, source, source_url, score, movie_slug, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return NextResponse.json({ items: data ?? [] });
  } catch {
    // No Supabase configured (or the query failed) — fall back to whatever
    // scripts/controversy_bot.py last wrote to data/controversies.json.
    // Real scraped data, just not persisted to Postgres.
    const items = await readLocalControversies();
    return NextResponse.json({ items: items.slice(0, 20) });
  }
}
