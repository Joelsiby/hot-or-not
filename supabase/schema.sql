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

-- Live controversy bot (lib/controversy-bot) — see README "Live controversy
-- bot" section. Movies here get merged with the static list in
-- lib/movies.ts at read time; slug is the shared join key.
create table if not exists movies (
  slug text primary key,
  title text not null,
  poster_emoji text not null default '🎬',
  source text not null default 'bot' check (source in ('bot', 'manual')),
  created_at timestamptz not null default now()
);

-- Signals scraped from Reddit / entertainment RSS feeds. Ones that score
-- high enough (see PROMOTE_THRESHOLD in lib/controversy-bot/ingest.ts) get
-- auto-promoted into `movies` above so people can immediately post
-- Hot/Not takes on them. `source_url` is unique so re-running the bot
-- never double-inserts the same post/article.
create table if not exists controversies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  source text not null check (source in ('reddit', 'rss')),
  source_url text not null unique,
  score integer not null default 0,
  movie_slug text references movies (slug) on delete set null,
  status text not null default 'new' check (status in ('new', 'promoted', 'ignored')),
  created_at timestamptz not null default now()
);

create index if not exists controversies_created_at_idx on controversies (created_at desc);

alter table movies enable row level security;
alter table controversies enable row level security;

-- Unlike comments/upvote_payments, the live feed reads these two tables
-- straight from the browser (Supabase Realtime + the anon/publishable
-- key), so they need an explicit public read policy.
drop policy if exists "Public read access" on movies;
create policy "Public read access" on movies for select using (true);
drop policy if exists "Public read access" on controversies;
create policy "Public read access" on controversies for select using (true);

-- Enable Realtime replication for both tables (safe to re-run; Supabase
-- projects ship a `supabase_realtime` publication by default).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'controversies'
  ) then
    alter publication supabase_realtime add table controversies;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'movies'
  ) then
    alter publication supabase_realtime add table movies;
  end if;
end $$;
