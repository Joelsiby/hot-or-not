-- Run this once against your Supabase project (SQL Editor or `supabase db push`).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

create extension if not exists "pgcrypto";

-- Movies themselves are a static list in `lib/movies.ts` — this table only
-- holds the fan comments posted under each movie's slug. Posting is free;
-- `upvotes`/`amount_paise` are running totals kept in sync by
-- increment_comment_upvote() whenever a paid upvote clears.
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  movie_slug text not null,
  side text not null check (side in ('hot', 'not')),
  author_name text not null,
  body text not null,
  image_url text,
  thumbnail_url text,
  upvotes integer not null default 0,
  amount_paise integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists comments_movie_slug_idx on comments (movie_slug, created_at desc);
create index if not exists comments_movie_side_rank_idx
  on comments (movie_slug, side, amount_paise desc, created_at desc);

-- The payment ledger: one row per upvote checkout attempt (₹100 base price,
-- fixed), successful or not. Doubles as the "who upvoted what" record and
-- as the source of truth for reconciling against Polar — a webhook retry
-- or duplicate delivery can't double-count because `polar_checkout_id` is
-- unique and increment_comment_upvote() only ever fires once per row (see
-- the `status = 'pending'` guard in app/api/webhooks/polar/route.ts).
create table if not exists upvote_payments (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references comments (id) on delete cascade,
  movie_slug text not null,
  upvoter_name text,
  upvoter_email text,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR',
  polar_checkout_id text not null unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- Backfill for a database created before upvoter identity / paid_at existed.
alter table upvote_payments add column if not exists upvoter_name text;
alter table upvote_payments add column if not exists upvoter_email text;
alter table upvote_payments add column if not exists currency text not null default 'INR';
alter table upvote_payments add column if not exists paid_at timestamptz;

create index if not exists upvote_payments_comment_id_idx on upvote_payments (comment_id);
create index if not exists upvote_payments_status_idx on upvote_payments (status);
create index if not exists upvote_payments_movie_slug_idx on upvote_payments (movie_slug, created_at desc);
create index if not exists upvote_payments_upvoter_email_idx on upvote_payments (upvoter_email);

-- All reads/writes go through server-only route handlers using the
-- service-role/secret key, so no public RLS policies are required. If you
-- later add client-side reads with the anon/publishable key, enable RLS
-- and add a public select policy scoped to what should actually be public
-- (upvote_payments holds emails — don't expose it to anon reads as-is).
alter table comments enable row level security;
alter table upvote_payments enable row level security;

create or replace function increment_comment_upvote(p_comment_id uuid, p_amount_paise integer)
returns void as $$
begin
  update comments
  set upvotes = upvotes + 1,
      amount_paise = amount_paise + p_amount_paise
  where id = p_comment_id;
end;
$$ language plpgsql;

-- Also create a public storage bucket named `comment-images` (Storage tab
-- in the Supabase dashboard, "Public bucket" on) for full-size uploads —
-- thumbnails are stored inline on the row above.
