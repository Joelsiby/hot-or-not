#!/usr/bin/env python3
"""
Live controversy bot — scrapes REAL Reddit + entertainment RSS feeds for
movie backlash/controversy signals and writes them to local JSON files
under data/. The Next.js app reads those files (see
app/api/controversies/route.ts and lib/movies.ts) whenever Supabase isn't
configured, so this is enough to see live data end-to-end with zero setup.

No API keys required — Reddit's read-only JSON endpoints and public RSS
feeds are both free. Stdlib only, no pip install needed.

Run once:
    python scripts/controversy_bot.py

Run continuously, polling every 120s:
    python scripts/controversy_bot.py --loop --interval 120
"""
import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, 'data')
CONTROVERSIES_PATH = os.path.join(DATA_DIR, 'controversies.json')
MOVIES_PATH = os.path.join(DATA_DIR, 'movies.json')

SUBREDDITS = ['movies', 'boxoffice', 'Bollywood', 'entertainment', 'india', 'bollywoodmemes']
RSS_FEEDS = [
    'https://variety.com/feed/',
    'https://www.hollywoodreporter.com/feed/',
    'https://deadline.com/feed/',
    'https://www.indiewire.com/feed/',
]

# General entertainment feeds rarely word-match enough backlash keywords to
# clear PROMOTE_THRESHOLD on their own — a targeted Google News search RSS
# (no key required) surfaces headlines that are already *about* a
# controversy, which is a much stronger real signal for "movie X is
# getting backlash" specifically.
GOOGLE_NEWS_QUERIES = [
    'movie backlash',
    'film boycott',
    'movie controversy',
    'movie review bomb',
]

# Same scoring rules as lib/controversy-bot/detect.ts — keep the two in sync.
BACKLASH_KEYWORDS = [
    'backlash', 'boycott', 'controversy', 'controversial', 'slammed', 'under fire',
    'criticized', 'criticised', 'outrage', 'row over', 'sparks row', 'trolled',
    'review bomb', 'flop', 'banned', 'ban on', 'walkout', 'protest', 'accused',
    'lawsuit', 'plagiarism', 'apologizes', 'apologises', 'deepfake', 'leaked',
]
MOVIE_HINT_KEYWORDS = ['movie', 'film', 'trailer', 'box office', 'actor', 'actress', 'director']

MIN_STORE_SCORE = 2   # worth showing in the live feed
PROMOTE_THRESHOLD = 4  # worth auto-adding as a debatable movie
EMOJIS = ['🔥', '🍿', '🎬', '📢', '⚡', '🌶️', '💥']
USER_AGENT = os.environ.get('REDDIT_USER_AGENT', 'hot-or-not-controversy-bot/1.0 (local script)')


def fetch_json(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))


def fetch_text(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read().decode('utf-8', errors='replace')


def fetch_reddit_signals():
    signals = []
    for sub in SUBREDDITS:
        try:
            data = fetch_json(
                f'https://www.reddit.com/r/{sub}/new.json?limit=25',
                headers={'User-Agent': USER_AGENT},
            )
            for post in data.get('data', {}).get('children', []):
                d = post.get('data', {})
                title = d.get('title')
                permalink = d.get('permalink')
                if not title or not permalink:
                    continue
                created = d.get('created_utc', time.time())
                signals.append({
                    'title': title,
                    'summary': (d.get('selftext') or '')[:400],
                    'url': f'https://www.reddit.com{permalink}',
                    'source': 'reddit',
                })
        except Exception as exc:  # one subreddit failing shouldn't kill the run
            print(f'  [reddit] r/{sub} failed: {exc}', file=sys.stderr)
    return signals


def strip_html(text):
    return re.sub('<[^<]+?>', '', text or '').strip()


def fetch_rss_signals():
    signals = []
    for feed_url in RSS_FEEDS:
        try:
            xml_text = fetch_text(feed_url, headers={'User-Agent': USER_AGENT})
            root = ET.fromstring(xml_text)
            for item in root.iter('item'):
                title_el = item.find('title')
                link_el = item.find('link')
                desc_el = item.find('description')
                title = title_el.text if title_el is not None else None
                link = link_el.text if link_el is not None else None
                if not title or not link:
                    continue
                signals.append({
                    'title': title.strip(),
                    'summary': strip_html(desc_el.text if desc_el is not None else '')[:400],
                    'url': link.strip(),
                    'source': 'rss',
                })
        except Exception as exc:  # one feed failing shouldn't kill the run
            print(f'  [rss] {feed_url} failed: {exc}', file=sys.stderr)
    return signals


def fetch_google_news_signals():
    signals = []
    for query in GOOGLE_NEWS_QUERIES:
        encoded = urllib.parse.quote(query)
        url = f'https://news.google.com/rss/search?q={encoded}&hl=en-US&gl=US&ceid=US:US'
        try:
            xml_text = fetch_text(url, headers={'User-Agent': USER_AGENT})
            root = ET.fromstring(xml_text)
            for item in root.iter('item'):
                title_el = item.find('title')
                link_el = item.find('link')
                desc_el = item.find('description')
                title = title_el.text if title_el is not None else None
                link = link_el.text if link_el is not None else None
                if not title or not link:
                    continue
                signals.append({
                    'title': title.strip(),
                    'summary': strip_html(desc_el.text if desc_el is not None else '')[:400],
                    'url': link.strip(),
                    'source': 'rss',
                })
        except Exception as exc:  # one query failing shouldn't kill the run
            print(f'  [google-news] {query!r} failed: {exc}', file=sys.stderr)
    return signals


def score_text(text):
    lower = text.lower()
    score = 0
    for kw in BACKLASH_KEYWORDS:
        if kw in lower:
            score += 2
    for kw in MOVIE_HINT_KEYWORDS:
        if kw in lower:
            score += 1
    return score


def guess_title(headline):
    quoted = re.search(r'["\'“]([^"\'”]{3,60})["\'”]', headline)
    if quoted:
        return quoted.group(1).strip()
    trimmed = re.sub(r'\s*[-|:].*$', '', headline).strip()
    return (trimmed or headline)[:60]


def slugify(title):
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:40]
    return slug or f'controversy-{int(time.time())}'


def pick_emoji(url):
    digest = hashlib.md5(url.encode('utf-8')).hexdigest()
    return EMOJIS[int(digest, 16) % len(EMOJIS)]


def load_json(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return default


def save_json(path, value):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp_path = path + '.tmp'
    with open(tmp_path, 'w', encoding='utf-8') as f:
        json.dump(value, f, indent=2, ensure_ascii=False)
    os.replace(tmp_path, path)


def run_once():
    os.makedirs(DATA_DIR, exist_ok=True)
    controversies = load_json(CONTROVERSIES_PATH, [])
    movies = load_json(MOVIES_PATH, [])

    seen_urls = {c['source_url'] for c in controversies}
    seen_slugs = {m['slug'] for m in movies}

    print('Fetching Reddit (r/movies, r/boxoffice, r/Bollywood, ...)...')
    reddit_signals = fetch_reddit_signals()
    print(f'  {len(reddit_signals)} posts')

    print('Fetching RSS (Variety, THR, Deadline, IndieWire)...')
    rss_signals = fetch_rss_signals()
    print(f'  {len(rss_signals)} articles')

    print('Fetching Google News search RSS (movie backlash / boycott / controversy)...')
    google_signals = fetch_google_news_signals()
    print(f'  {len(google_signals)} articles')

    stored = 0
    promoted = 0

    for signal in reddit_signals + rss_signals + google_signals:
        if signal['url'] in seen_urls:
            continue
        score = score_text(f"{signal['title']} {signal['summary']}")
        if score < MIN_STORE_SCORE:
            continue

        guessed_title = guess_title(signal['title'])
        movie_slug = None
        if score >= PROMOTE_THRESHOLD:
            movie_slug = slugify(guessed_title)
            if movie_slug not in seen_slugs:
                movies.append({
                    'slug': movie_slug,
                    'title': guessed_title,
                    'posterEmoji': pick_emoji(signal['url']),
                })
                seen_slugs.add(movie_slug)
                promoted += 1

        controversies.append({
            'id': hashlib.md5(signal['url'].encode('utf-8')).hexdigest(),
            'title': signal['title'],
            'summary': signal['summary'] or None,
            'source': signal['source'],
            'source_url': signal['url'],
            'score': score,
            'movie_slug': movie_slug,
            'status': 'promoted' if movie_slug else 'new',
            'created_at': datetime.now(timezone.utc).isoformat(),
        })
        seen_urls.add(signal['url'])
        stored += 1

    controversies.sort(key=lambda c: c['created_at'], reverse=True)
    controversies = controversies[:50]

    save_json(CONTROVERSIES_PATH, controversies)
    save_json(MOVIES_PATH, movies)

    total = len(reddit_signals) + len(rss_signals) + len(google_signals)
    print(f'Fetched {total} total · stored {stored} new controversy(ies) · promoted {promoted} new movie(s)')
    return stored, promoted


def main():
    parser = argparse.ArgumentParser(description='Scrape real movie controversy signals into local JSON files.')
    parser.add_argument('--loop', action='store_true', help='Keep running, polling on --interval seconds.')
    parser.add_argument('--interval', type=int, default=120, help='Seconds between polls when --loop is set.')
    args = parser.parse_args()

    if not args.loop:
        run_once()
        return

    print(f'Polling every {args.interval}s — Ctrl+C to stop.')
    while True:
        try:
            run_once()
        except Exception as exc:
            print(f'Ingest run failed: {exc}', file=sys.stderr)
        time.sleep(args.interval)


if __name__ == '__main__':
    main()
