import type { RawSignal } from '../types';

// Reddit's public read-only JSON endpoints — no OAuth app needed. A
// descriptive User-Agent matters: Reddit aggressively rate-limits/blocks
// the default fetch UA. Set REDDIT_USER_AGENT in production.
const SUBREDDITS = ['movies', 'boxoffice', 'Bollywood', 'entertainment', 'india', 'bollywoodmemes'];

export async function fetchRedditSignals(): Promise<RawSignal[]> {
  const userAgent = process.env.REDDIT_USER_AGENT || 'hot-or-not-controversy-bot/1.0';
  const results: RawSignal[] = [];

  await Promise.all(
    SUBREDDITS.map(async (sub) => {
      try {
        const res = await fetch(`https://www.reddit.com/r/${sub}/new.json?limit=25`, {
          headers: { 'User-Agent': userAgent },
          cache: 'no-store',
        });
        if (!res.ok) return;
        const json = await res.json();
        const posts: unknown[] = json?.data?.children ?? [];

        for (const post of posts) {
          const d = (post as { data?: Record<string, unknown> })?.data;
          const title = d?.title as string | undefined;
          const permalink = d?.permalink as string | undefined;
          if (!title || !permalink) continue;

          const createdUtc = (d?.created_utc as number | undefined) ?? Date.now() / 1000;
          results.push({
            title,
            summary: d?.selftext ? String(d.selftext).slice(0, 400) : '',
            url: `https://www.reddit.com${permalink}`,
            source: 'reddit',
            publishedAt: new Date(createdUtc * 1000).toISOString(),
          });
        }
      } catch {
        // one subreddit failing (rate limit, network blip) shouldn't kill the whole run
      }
    })
  );

  return results;
}
