# Hot or Not

Based on the [Outbid Template](https://github.com/shadcn-labs/outbid-template).

A movie fan battleground built with Next.js and shadcn/ui. Pick a movie from the list, then argue for it in the **Hot** column or against it in the **Not** column. Posting a take is free; upvoting one costs a flat ₹100 and pushes it up its column — the meter above each movie shows, in real money, which side is winning.

This repo is meant to be used as a **template**: clone it, swap in your own movies and branding, and ship your own version.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) components (in `components/ui`)
- [Supabase](https://supabase.com) (Postgres + Storage) — comment storage and image uploads
- [Upstash Redis](https://upstash.com) — caches each movie's comment thread
- [Polar](https://polar.sh) — checkout for paid upvotes (₹100 fixed price)
- [Umami](https://umami.is) — analytics
- TypeScript

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app. The dev server supports Fast Refresh, so edits to `app/` and `components/` show up immediately.

Other scripts:

```bash
pnpm build       # production build
pnpm start       # run the production build
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
pnpm format      # prettier --write
```

## Project structure

```
app/
  page.tsx                    # home page (movie list, Hot/Not columns, trending, activity)
  about/, rules/, stats/, friends/   # static/info pages
  api/
    comments/route.ts               # GET: comments for a movie · POST: create a comment (free)
    comments/upload-image/route.ts  # POST: uploads a comment's full-size image to Supabase Storage
    upvote/route.ts                 # POST: creates a ₹100 Polar checkout for one comment
    webhooks/polar/route.ts         # Polar order.paid webhook -> increments upvotes, busts cache
components/
  ui/                    # shadcn/ui primitives (Button, Card, Sheet, ...)
  header.tsx, footer.tsx
  movie-list.tsx         # left sidebar (desktop) / chip row (mobile) of movies
  vote-meter.tsx         # Hot vs Not totals bar for the selected movie
  comment-column.tsx, comment-card.tsx, comment-composer.tsx
  hover-image.tsx        # microsize thumbnail by default, full image loads on hover
  trending-section.tsx   # top 3 most-upvoted comments
  latest-activity.tsx    # most recent comments
  mobile-layout.tsx, app-sidebar.tsx
  umami-analytics.tsx
lib/
  movies.ts              # static movie list (slug, title, emoji)
  comments-data.ts       # types + static seed data (used until Supabase is configured)
  comments.ts            # cache-aside read (Redis) + cache invalidation, per movie
  constants.ts           # BASE_PRICE_PAISE (₹100) + INR formatting
  supabase/server.ts     # service-role Supabase client (server-only)
  supabase/storage.ts    # uploads a comment image to the `comment-images` bucket
  redis.ts               # Upstash Redis client
  polar.ts               # Polar SDK client
  utils.ts               # `cn()` class-merging helper
supabase/
  schema.sql             # comments + upvote_payments tables
hooks/
  use-mobile.ts
```

## Customizing for your own project

- **Movies** — add or edit entries in `lib/movies.ts`; the sidebar and comment threads pick them up automatically.
- **Branding** — the site name and nav links live in `components/header.tsx`; update the footer in `components/footer.tsx`.
- **Base price** — change `BASE_PRICE_PAISE` in `lib/constants.ts` to adjust the flat upvote cost.
- **Copy pages** — `app/about`, `app/rules`, `app/friends`, and `app/stats` are placeholder content pages; edit or remove as needed.
- **Theme** — colors and design tokens live in `app/globals.css`; the `ThemeProvider`/`ThemeToggle` components support light/dark mode out of the box.

## Adding shadcn/ui components

```bash
npx shadcn@latest add <component>
```

This places new components in `components/ui`. Import them as:

```tsx
import { Button } from "@/components/ui/button"
```

The base `Card` component (`components/ui/card.tsx`) already ships with `border border-border` baked in — don't add an extra `border` class on top of it, or you'll get a double border.

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you need:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | For checkout | Base URL used for the Polar checkout success redirect. |
| `SUPABASE_URL` | For live data | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | For live data | Service-role key — server-only, never expose to the client. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | For live data | Upstash Redis REST credentials, used to cache each movie's comment thread. |
| `POLAR_ACCESS_TOKEN` | For checkout | Polar organization access token. |
| `POLAR_WEBHOOK_SECRET` | For checkout | Secret for verifying incoming Polar webhooks. |
| `POLAR_PRODUCT_ID` | For checkout | The product used to represent "upvote a comment" (₹100 fixed price). |
| `POLAR_SERVER` | No | `sandbox` (default) or `production`. |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | No | Enables [Umami](https://umami.is) analytics. Leave unset to disable tracking entirely (default). |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | No | Only needed for a self-hosted Umami instance; defaults to Umami Cloud's script. |

Until the Supabase/Redis/Polar variables are set, the app runs fine off the static seed data in `lib/comments-data.ts` and the "Post" / upvote buttons will surface the API's error response — nothing crashes, it just isn't wired to a real backend yet.

## Backend setup (Supabase + Redis + Polar)

The mechanic is: read a movie's comment thread often (cheap, cached), write to it often too (posting is free), but only a paid upvote changes ranking or the vote meter. That maps to Postgres for the source of truth, Redis in front of it for reads, Supabase Storage for images, and Polar handling the ₹100 charge.

**1. Supabase (Postgres + Storage)**

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` against it (SQL Editor, or `supabase db push` with the CLI). This creates `comments` (one row per posted take) and `upvote_payments` (one row per checkout attempt).
3. In the Storage tab, create a **public** bucket named `comment-images` — full-size uploads go here; a tiny thumbnail is stored inline on the `comments` row instead, so cards render instantly and only fetch the full image on hover.
4. Copy the project URL and the **service role** key (Project Settings → API) into `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`. This key is only ever used server-side, in route handlers.

**2. Upstash Redis**

1. Create a database at [console.upstash.com](https://console.upstash.com) (or use the Vercel integration, which sets the env vars for you automatically).
2. Copy the REST URL and token into `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
3. `GET /api/comments?movie=<slug>` (`lib/comments.ts`) reads from Redis first and only falls back to Supabase on a cache miss, with a 15s TTL — so an open movie thread, which gets polled constantly, isn't hammering Postgres. The cache is also explicitly invalidated the moment a comment is posted or an upvote is paid.

**3. Polar (payments)**

1. Create an organization at [polar.sh](https://polar.sh) and a product with a fixed **₹100 (INR)** price to represent one upvote.
2. Create an Organization Access Token and set it as `POLAR_ACCESS_TOKEN`; set the product's ID as `POLAR_PRODUCT_ID`.
3. Add a webhook endpoint pointing at `https://<your-domain>/api/webhooks/polar`, subscribed to `order.paid`, and put its signing secret in `POLAR_WEBHOOK_SECRET`.
4. Flow: clicking the upvote arrow on a comment posts its ID to `POST /api/upvote` (`app/api/upvote/route.ts`), which creates a ₹100 Polar checkout and redirects the browser to Polar. On successful payment, the `order.paid` webhook (`app/api/webhooks/polar/route.ts`) increments that comment's `upvotes`/`amount_paise` in Supabase and busts the Redis cache for that movie.
5. Use `POLAR_SERVER=sandbox` while testing — Polar's sandbox lets you complete checkouts without a real card.

## Deploying to Vercel

1. Push this repo to GitHub and [import it into Vercel](https://vercel.com/new) — it's a standard Next.js app, so framework detection, build command, and the pnpm lockfile are all picked up automatically. No `vercel.json` needed.
2. Add the environment variables from `.env.example` under Project Settings → Environment Variables. The app builds and deploys fine with none of them set — it just falls back to the static seed data in `lib/comments-data.ts` until you add them.
3. `NEXT_PUBLIC_SITE_URL` is optional: if you skip it, `lib/site-url.ts` falls back to Vercel's own `VERCEL_URL`, so Polar checkout redirects and the sitemap still resolve to the right deployment URL. Set it once you have a custom domain.
4. Point your Polar webhook at `https://<your-vercel-domain>/api/webhooks/polar` and your Supabase Storage bucket stays public regardless of host — nothing else is Vercel-specific.

## Analytics

Analytics are powered by [Umami](https://umami.is), a privacy-friendly, open-source alternative to Google Analytics. The tracking script (`components/umami-analytics.tsx`) only loads when `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set, so it's a no-op in local development unless you configure it.

1. Create a site in [Umami Cloud](https://cloud.umami.is) (or your self-hosted instance) and copy its website ID.
2. Set `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (and `NEXT_PUBLIC_UMAMI_SCRIPT_URL` if self-hosting) in your environment.
3. Redeploy — pageviews will start showing up in your Umami dashboard.
