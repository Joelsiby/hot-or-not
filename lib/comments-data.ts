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

// No dummy data — the feed starts empty per movie until real comments are
// posted (via Supabase once it's configured, or in-memory via the API's
// error fallback otherwise).
export const seedComments: Comment[] = [];
