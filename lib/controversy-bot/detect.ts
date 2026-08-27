import type { RawSignal } from './types';

// Each hit adds to a signal's score — see MIN_STORE_SCORE / PROMOTE_THRESHOLD
// in ingest.ts for what the totals mean.
const BACKLASH_KEYWORDS = [
  'backlash',
  'boycott',
  'controversy',
  'controversial',
  'slammed',
  'under fire',
  'criticized',
  'criticised',
  'outrage',
  'row over',
  'sparks row',
  'trolled',
  'review bomb',
  'flop',
  'banned',
  'ban on',
  'walkout',
  'protest',
  'accused',
  'lawsuit',
  'plagiarism',
  'apologizes',
  'apologises',
  'deepfake',
  'leaked',
];

const MOVIE_HINT_KEYWORDS = ['movie', 'film', 'trailer', 'box office', 'actor', 'actress', 'director'];

export interface ScoredSignal extends RawSignal {
  score: number;
  guessedTitle: string;
}

function scoreText(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of BACKLASH_KEYWORDS) {
    if (lower.includes(kw)) score += 2;
  }
  for (const kw of MOVIE_HINT_KEYWORDS) {
    if (lower.includes(kw)) score += 1;
  }
  return score;
}

// Best-effort "what movie is this about" guess: prefer a quoted title,
// otherwise fall back to the headline itself, trimmed at the first dash/
// colon/pipe (where most headlines split "Title - reason it's news").
// Good enough to seed a debate topic — nobody's hand-editing a slug at 2am.
function guessTitle(headline: string): string {
  const quoted = headline.match(/['"“]([^'"”]{3,60})['"”]/);
  if (quoted) return quoted[1].trim();
  return headline.replace(/\s*[-|:].*$/, '').trim().slice(0, 60) || headline.slice(0, 60);
}

export function scoreSignal(signal: RawSignal): ScoredSignal {
  const score = scoreText(`${signal.title} ${signal.summary}`);
  return { ...signal, score, guessedTitle: guessTitle(signal.title) };
}

export function scoreSignals(signals: RawSignal[]): ScoredSignal[] {
  return signals.map(scoreSignal).sort((a, b) => b.score - a.score);
}
