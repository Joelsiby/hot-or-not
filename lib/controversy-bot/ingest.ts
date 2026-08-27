import { getSupabaseServerClient } from '@/lib/supabase/server';
import { fetchRedditSignals } from './sources/reddit';
import { fetchRssSignals } from './sources/rss';
import { fetchGoogleNewsSignals } from './sources/google-news';
import { scoreSignals, type ScoredSignal } from './detect';

const MIN_STORE_SCORE = 2; // worth showing in the live feed
const PROMOTE_THRESHOLD = 4; // worth auto-adding as a debatable movie

const EMOJIS = ['🔥', '🍿', '🎬', '📢', '⚡', '🌶️', '💥'];

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || `controversy-${Date.now()}`;
}

function pickEmoji(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return EMOJIS[Math.abs(hash) % EMOJIS.length];
}

export interface IngestResult {
  fetched: number;
  stored: number;
  promoted: number;
}

// Fetch -> score -> store -> auto-promote. Safe to call repeatedly on a
// schedule: both inserts use onConflict + ignoreDuplicates, so re-seeing
// the same Reddit post or RSS article across runs is a no-op.
export async function runControversyIngest(): Promise<IngestResult> {
  const [reddit, rss, googleNews] = await Promise.all([
    fetchRedditSignals(),
    fetchRssSignals(),
    fetchGoogleNewsSignals(),
  ]);
  const scored = scoreSignals([...reddit, ...rss, ...googleNews]).filter((s) => s.score >= MIN_STORE_SCORE);

  const result: IngestResult = { fetched: reddit.length + rss.length + googleNews.length, stored: 0, promoted: 0 };
  if (scored.length === 0) return result;

  const supabase = getSupabaseServerClient();

  for (const signal of scored) {
    const movieSlug = await maybePromote(supabase, signal, result);

    const { error, data } = await supabase
      .from('controversies')
      .upsert(
        {
          title: signal.title,
          summary: signal.summary || null,
          source: signal.source,
          source_url: signal.url,
          score: signal.score,
          movie_slug: movieSlug,
          status: movieSlug ? 'promoted' : 'new',
        },
        { onConflict: 'source_url', ignoreDuplicates: true }
      )
      .select('id');

    if (!error && data && data.length > 0) result.stored += 1;
  }

  return result;
}

async function maybePromote(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  signal: ScoredSignal,
  result: IngestResult
): Promise<string | null> {
  if (signal.score < PROMOTE_THRESHOLD) return null;

  const slug = slugify(signal.guessedTitle);
  const { data, error } = await supabase
    .from('movies')
    .upsert(
      { slug, title: signal.guessedTitle, poster_emoji: pickEmoji(signal.url), source: 'bot' },
      { onConflict: 'slug', ignoreDuplicates: true }
    )
    .select('slug');

  if (error) return null;
  if (data && data.length > 0) result.promoted += 1;
  return slug;
}
