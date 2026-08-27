import { promises as fs } from 'fs';
import path from 'path';

// Local fallback data source for the live controversy bot when Supabase
// isn't configured. scripts/controversy_bot.py writes these two files
// with real scraped Reddit/RSS data — nothing here is mocked, it's just
// not in Postgres.
const DATA_DIR = path.join(process.cwd(), 'data');
const CONTROVERSIES_PATH = path.join(DATA_DIR, 'controversies.json');
const MOVIES_PATH = path.join(DATA_DIR, 'movies.json');

export interface LocalControversy {
  id: string;
  title: string;
  summary: string | null;
  source: 'reddit' | 'rss';
  source_url: string;
  score: number;
  movie_slug: string | null;
  status: string;
  created_at: string;
}

export interface LocalMovie {
  slug: string;
  title: string;
  posterEmoji: string;
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    // File doesn't exist yet (bot hasn't run), or is mid-write — empty is fine.
    return [];
  }
}

export function readLocalControversies(): Promise<LocalControversy[]> {
  return readJsonArray<LocalControversy>(CONTROVERSIES_PATH);
}

export function readLocalMovies(): Promise<LocalMovie[]> {
  return readJsonArray<LocalMovie>(MOVIES_PATH);
}
