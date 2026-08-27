export type Side = 'hot' | 'not';

export interface Comment {
  id: string;
  movieSlug: string;
  side: Side;
  authorName: string;
  body: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  upvotes: number;
  amountPaise: number;
  createdAt: string;
}

// Seed data for local development when no database is configured. Live data
// is served from Supabase via `lib/comments.ts`.
export const seedComments: Comment[] = [
  {
    id: 'seed-1',
    movieSlug: 'toxic',
    side: 'hot',
    authorName: 'yash_stan_99',
    body: "Yash's screen presence alone is worth the ticket. The action choreography in the second half is unmatched this year.",
    imageUrl: null,
    thumbnailUrl: null,
    upvotes: 42,
    amountPaise: 42 * 10000,
    createdAt: new Date(Date.now() - 3 * 60_000).toISOString(),
  },
  {
    id: 'seed-2',
    movieSlug: 'toxic',
    side: 'hot',
    authorName: 'cinemaddict',
    body: 'The soundtrack goes so hard, I had chills during the interval block. Genuinely one of the best openings in recent memory.',
    imageUrl: null,
    thumbnailUrl: null,
    upvotes: 18,
    amountPaise: 18 * 10000,
    createdAt: new Date(Date.now() - 40 * 60_000).toISOString(),
  },
  {
    id: 'seed-3',
    movieSlug: 'toxic',
    side: 'not',
    authorName: 'critic_anjali',
    body: 'Style over substance — gorgeous frames but the plot meanders for a full 40 minutes before anything happens.',
    imageUrl: null,
    thumbnailUrl: null,
    upvotes: 31,
    amountPaise: 31 * 10000,
    createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
  },
  {
    id: 'seed-4',
    movieSlug: 'toxic',
    side: 'not',
    authorName: 'reelrealist',
    body: "Runtime is brutal. Could've been 30 minutes shorter with zero loss to the story.",
    imageUrl: null,
    thumbnailUrl: null,
    upvotes: 9,
    amountPaise: 9 * 10000,
    createdAt: new Date(Date.now() - 90 * 60_000).toISOString(),
  },
];
