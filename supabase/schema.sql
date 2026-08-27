-- Run this once against your Supabase project (SQL Editor or `supabase db push`).

create extension if not exists "pgcrypto";

-- Movies themselves are a static list in `lib/movies.ts` — this table only
-- holds the fan comments posted under each movie's slug.
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

-- One row per paid upvote (₹20 base price, fixed, or a whole multiple of
-- it). Mirrors a payment ledger so a webhook retry / duplicate delivery
-- can't double-count — razorpay_order_id is unique and
-- increment_comment_upvote() only fires once per row (see the
-- `status = 'pending'` guard in app/api/razorpay/verify/route.ts).
create table if not exists upvote_payments (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references comments (id) on delete cascade,
  movie_slug text not null,
  amount_paise integer not null check (amount_paise > 0),
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now()
);

-- Migration for a database created before the Razorpay switch (was
-- Polar's polar_checkout_id) — safe to re-run.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'upvote_payments' and column_name = 'polar_checkout_id'
  ) then
    alter table upvote_payments rename column polar_checkout_id to razorpay_order_id;
  end if;
end $$;
alter table upvote_payments add column if not exists razorpay_payment_id text;

create index if not exists upvote_payments_comment_id_idx on upvote_payments (comment_id);

-- All reads/writes go through server-only route handlers using the service
-- role key, so no public RLS policies are required. If you later add
-- client-side reads with the anon key, enable RLS and add a public select
-- policy on `comments`.
alter table comments enable row level security;
alter table upvote_payments enable row level security;

-- RLS being on isn't what actually blocks the app — Postgres' own table
-- privileges are checked first, and Supabase's newer sb_secret_ keys don't
-- always inherit the default grants a classic service_role key gets.
-- Without this, every query 403s with "permission denied for table
-- comments" even though the service role itself bypasses RLS.
grant select, insert, update, delete on comments to service_role;
grant select, insert, update, delete on upvote_payments to service_role;

create or replace function increment_comment_upvote(p_comment_id uuid, p_amount_paise integer)
returns void as $$
begin
  update comments
  set upvotes = upvotes + 1,
      amount_paise = amount_paise + p_amount_paise
  where id = p_comment_id;
end;
$$ language plpgsql;

grant execute on function increment_comment_upvote(uuid, integer) to service_role;

-- Also create a public storage bucket named `comment-images` (Storage tab
-- in the Supabase dashboard, "Public bucket" on) for full-size uploads —
-- thumbnails are stored inline on the row above.
