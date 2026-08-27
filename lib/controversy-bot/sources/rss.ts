import Parser from 'rss-parser';
import type { RawSignal } from '../types';

const FEEDS = [
  'https://variety.com/feed/',
  'https://www.hollywoodreporter.com/feed/',
  'https://deadline.com/feed/',
  'https://www.indiewire.com/feed/',
];

const parser = new Parser({ timeout: 8000 });

export async function fetchRssSignals(): Promise<RawSignal[]> {
  const results: RawSignal[] = [];

  await Promise.all(
    FEEDS.map(async (feedUrl) => {
      try {
        const feed = await parser.parseURL(feedUrl);
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
        // one feed failing (timeout, malformed XML) shouldn't kill the whole run
      }
    })
  );

  return results;
}
