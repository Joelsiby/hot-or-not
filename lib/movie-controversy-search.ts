import Parser from 'rss-parser';

export interface MovieControversyItem {
  id: string;
  title: string;
  sourceUrl: string;
  publishedAt: string;
}

// On-demand, per-movie version of the old always-on scraper: instead of a
// global feed of "whatever's controversial right now", this searches
// Google News RSS (public, no API key) for headlines about backlash,
// boycotts, or controversy specifically involving the selected movie —
// fired once when a movie is clicked (see app/api/movie-controversies),
// not on a schedule.
//
// One combined OR query instead of four separate requests — was the main
// source of latency (up to 4x8s worst-case sequential-feeling timeouts).
const QUERY = '(backlash OR controversy OR boycott OR "review bomb")';
const parser = new Parser({ timeout: 6000 });

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').trim();
}

function hashId(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export async function fetchMovieControversies(movieTitle: string): Promise<MovieControversyItem[]> {
  const seen = new Set<string>();
  const items: MovieControversyItem[] = [];

  const query = `"${movieTitle}" ${QUERY}`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:US`;

  try {
    const feed = await parser.parseURL(url);
    for (const entry of feed.items ?? []) {
      if (!entry.title || !entry.link || seen.has(entry.link)) continue;
      seen.add(entry.link);
      items.push({
        id: hashId(entry.link),
        title: stripHtml(entry.title),
        sourceUrl: entry.link,
        publishedAt: entry.isoDate || new Date().toISOString(),
      });
    }
  } catch {
    // network hiccup or malformed feed — empty result, no crash
  }

  return items
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);
}
