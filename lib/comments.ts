import { redis } from '@/lib/redis';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Comment } from '@/lib/comments-data';

const CACHE_TTL_SECONDS = 15;
const cacheKey = (movieSlug: string) => `comments:v1:${movieSlug}`;

// Cache-aside per movie: a movie's comment thread is read constantly while
// it's open, so serve it from Redis when possible. Invalidated the moment a
// comment is posted or an upvote is paid, so it's never more than
// CACHE_TTL_SECONDS stale even without that. Redis is optional — any
// failure to read/write it just falls back to hitting Postgres directly,
// it never fails the request.
export async function getComments(movieSlug: string): Promise<Comment[]> {
  if (redis) {
    try {
      const cached = await redis.get<Comment[]>(cacheKey(movieSlug));
      if (cached) return cached;
    } catch {
      // Redis unreachable/misconfigured — fall through to Postgres.
    }
  }

  const items = await fetchCommentsFromDatabase(movieSlug);

  if (redis) {
    await redis.set(cacheKey(movieSlug), items, { ex: CACHE_TTL_SECONDS }).catch(() => {});
  }

  return items;
}

export async function invalidateCommentsCache(movieSlug: string) {
  if (!redis) return;
  await redis.del(cacheKey(movieSlug)).catch(() => {});
}

async function fetchCommentsFromDatabase(movieSlug: string): Promise<Comment[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('comments')
    .select('id, movie_slug, side, author_name, body, image_url, thumbnail_url, upvotes, amount_paise, created_at')
    .eq('movie_slug', movieSlug)
    .order('amount_paise', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    movieSlug: row.movie_slug,
    side: row.side,
    authorName: row.author_name,
    body: row.body,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url,
    upvotes: row.upvotes,
    amountPaise: row.amount_paise,
    createdAt: row.created_at,
  }));
}
