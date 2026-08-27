import Parser from 'rss-parser';
import type { RawSignal } from '../types';

// General entertainment RSS rarely word-matches enough backlash keywords
// to clear PROMOTE_THRESHOLD on its own — a targeted Google News search
// RSS (no key required) surfaces headlines that are already *about* a
// controversy, which is a much stronger signal for "movie X is getting
// backlash" specifically. Mirrors scripts/controversy_bot.py — keep in sync.
const QUERIES = ['movie backlash', 'film boycott', 'movie controversy', 'movie review bomb'];

const parser = new Parser({ timeout: 8000 });

export async function fetchGoogleNewsSignals(): Promise<RawSignal[]> {
  const results: RawSignal[] = [];

  await Promise.all(
    QUERIES.map(async (query) => {
      try {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:US`;
        const feed = await parser.parseURL(url);
        for (const item of feed.items ?? []) {
          if (!item.title || !item.link) continue;
          results.push({
            title: item.title,
            summary: (item.contentSnippet || item.content || '').slice(0, 400),
            url: item.link,
            source: 'rss',
            publishedAt: item.isoDate || new Date().toISOString(),
          });
        }
      } catch {
        // one query failing shouldn't kill the whole run
      }
    })
  );

  return results;
}
