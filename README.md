# Hate It or Love It

Based on the [Outbid Template](https://github.com/shadcn-labs/outbid-template).

A movie fan battleground built with Next.js and shadcn/ui. Pick a movie from the list, then argue for it in the **Love It** column or against it in the **Hate It** column. Posting a take and upvoting one both cost a flat ₹20 (pay more to claim a higher rank) via Razorpay (UPI, cards, netbanking, wallets) — the meter above each movie shows, in real money, which side is winning.

This repo is meant to be used as a **template**: clone it, swap in your own movies and branding, and ship your own version.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) components (in `components/ui`)
- [Supabase](https://supabase.com) (Postgres + Storage) — comment storage and image uploads
- [Upstash Redis](https://upstash.com) — caches each movie's comment thread
- [Razorpay](https://razorpay.com) — checkout for paid posts and upvotes (₹20 fixed price, UPI/cards/netbanking/wallets)
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
  page.tsx                    # home page (movie list, Love It/Hate It columns, trending, activity)
  about/, rules/, stats/, friends/   # static/info pages
  api/
    comments/route.ts               # GET: comments for a movie · POST: creates a Razorpay order for a new comment (held in comment_payments until paid)
    comments/upload-image/route.ts  # POST: uploads a comment's full-size image to Supabase Storage
    upvote/route.ts                 # POST: creates a Razorpay order for an upvote on an existing comment
    razorpay/verify/route.ts        # POST: verifies the payment signature, then inserts the comment / applies the upvote
components/
  ui/                    # shadcn/ui primitives (Button, Card, Sheet, ...)
  header.tsx, footer.tsx
  movie-list.tsx         # left sidebar (desktop) / chip row (mobile) of movies
  vote-meter.tsx         # Love It vs Hate It totals bar for the selected movie
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
  constants.ts           # BASE_PRICE_PAISE (₹20) + INR formatting
  supabase/server.ts     # service-role Supabase client (server-only)
  supabase/storage.ts    # uploads a comment image to the `comment-images` bucket
  redis.ts               # Upstash Redis client
  razorpay.ts            # Razorpay SDK client (server-only)
  load-razorpay-script.ts # lazy-loads Checkout.js once, client-side
  utils.ts               # `cn()` class-merging helper
supabase/
  schema.sql             # comments, upvote_payments, comment_payments tables
hooks/
  use-mobile.ts
```

## Customizing for your own project

- **Movies** — add or edit entries in `lib/movies.ts`; the sidebar and comment threads pick them up automatically.
- **Branding** — the site name and nav links live in `components/header.tsx`; update the footer in `components/footer.tsx`.
- **Base price** — change `BASE_PRICE_PAISE` in `lib/constants.ts` to adjust the flat cost of posting a comment or upvoting one.
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
| `NEXT_PUBLIC_SITE_URL` | No | Base URL used for the sitemap. Falls back to Vercel's `VERCEL_URL` when unset. |
| `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) | For live data | Supabase project URL — base URL only, no `/rest/v1/` suffix. |
| `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) | For live data | Service-role / secret key — server-only, never expose to the client. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | For live data | Upstash Redis REST credentials, used to cache each movie's comment thread. |
| `RAZORPAY_KEY_ID` | For checkout | Razorpay API key id — used server-side to create orders. |
| `RAZORPAY_KEY_SECRET` | For checkout | Razorpay API secret — creates orders and verifies payment signatures. Never expose to the client. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | For checkout | Same value as `RAZORPAY_KEY_ID` — Checkout.js needs it in the browser. |
| `RAZORPAY_WEBHOOK_SECRET` | No | Optional safety net for a payment that succeeds but the tab closes before the client-side verify call fires. Not required for the normal flow. |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | No | Enables [Umami](https://umami.is) analytics. Leave unset to disable tracking entirely (default). |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | No | Only needed for a self-hosted Umami instance; defaults to Umami Cloud's script. |

Until the Supabase/Redis variables are set, the app runs fine off the static seed data in `lib/comments-data.ts`, and posting/upvoting will surface the API's error response — nothing crashes, it just isn't wired to a real backend yet. Without the Razorpay variables set, posting and upvoting fail at the checkout step with a clear error, since both require creating a real order.

## Backend setup (Supabase + Redis + Razorpay)

The mechanic is: read a movie's comment thread often (cheap, cached), write to it rarely and only when paid for — both posting a comment and upvoting one require a completed ₹20 (or more) Razorpay payment before anything changes. That maps to Postgres for the source of truth, Redis in front of it for reads, Supabase Storage for images, and Razorpay handling the charge.

**1. Supabase (Postgres + Storage)**

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/schema.sql` against it via the **SQL Editor** (paste the whole file, Run — it's idempotent, safe to re-run any time the file changes). This creates `comments` (published takes), `upvote_payments` (one row per upvote checkout), and `comment_payments` (one row per new-comment checkout — a comment doesn't exist until its payment clears, so its content lives here until then). It also grants `service_role` the table/function privileges the newer `sb_secret_...` key format doesn't inherit automatically; without those grants every query 403s with "permission denied for table comments". Project API keys can't run DDL, so this step has to go through the SQL Editor or `supabase db push` with the CLI — not a route handler.
3. In the Storage tab, create a **public** bucket named `comment-images` — full-size uploads go here; a tiny thumbnail is stored inline on the `comments` row instead, so cards render instantly and only fetch the full image on hover.
4. Copy the project URL and the **service role** (or newer **secret**) key from Project Settings → API into `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (classic keys) or `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SECRET_KEY` (newer `sb_publishable_...`/`sb_secret_...` keys) — either naming works. This key is only ever used server-side, in route handlers.

**2. Upstash Redis**

1. Create a database at [console.upstash.com](https://console.upstash.com) (or use the Vercel integration, which sets the env vars for you automatically).
2. Copy the REST URL and token into `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
3. `GET /api/comments?movie=<slug>` (`lib/comments.ts`) reads from Redis first and only falls back to Supabase on a cache miss, with a 15s TTL — so an open movie thread, which gets polled constantly, isn't hammering Postgres. The cache is also explicitly invalidated the moment a payment is verified (a new comment lands, or an upvote is recorded).

**3. Razorpay (payments)**

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com) — an individual/freelancer account works, just complete KYC (PAN + bank account). Test Mode works immediately, before KYC clears.
2. Settings → API Keys → generate a key pair (separate ones for Test and Live). Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` (same value as `RAZORPAY_KEY_ID`).
3. Flow: `POST /api/comments` or `POST /api/upvote` creates a Razorpay order (amount in paise, no conversion needed — Razorpay uses paise too) and returns it to the browser, which opens Razorpay's standard Checkout — UPI, cards, netbanking, and wallets all show automatically, nothing in the code restricts the method list. On success, the browser posts the result to `POST /api/razorpay/verify`, which recomputes the HMAC-SHA256 signature server-side and only then writes the comment / applies the upvote. The client's success callback is never trusted on its own.
4. The webhook (`RAZORPAY_WEBHOOK_SECRET`, Settings → Webhooks → endpoint at `/api/webhooks/razorpay` subscribed to `payment.captured`/`payment.failed`) is optional — it only covers the edge case of a payment succeeding right as the tab closes before the verify call fires. That route doesn't exist yet; the normal flow works completely without it.
5. Test Mode card: `4111 1111 1111 1111`, any future expiry, any CVV — no real money moves.

## Deploying to Vercel

1. Push this repo to GitHub and [import it into Vercel](https://vercel.com/new) — it's a standard Next.js app, so framework detection, build command, and the pnpm lockfile are all picked up automatically. No `vercel.json` needed.
2. Add the environment variables from `.env.example` under Project Settings → Environment Variables. The app builds and deploys fine with none of them set — it just falls back to the static seed data in `lib/comments-data.ts` until you add them.
3. `NEXT_PUBLIC_SITE_URL` is optional: if you skip it, `lib/site-url.ts` falls back to Vercel's own `VERCEL_URL`, so the sitemap still resolves to the right deployment URL. Set it once you have a custom domain.
4. The CSP in `next.config.ts` already allow-lists `checkout.razorpay.com`/`api.razorpay.com` — if you add other third-party scripts later, remember this project has broken production once already from a too-strict CSP silently blocking something essential (see the git history around "unsafe-inline"). Test the live deploy, not just local dev, after any CSP change.

## Analytics

Analytics are powered by [Umami](https://umami.is), a privacy-friendly, open-source alternative to Google Analytics. The tracking script (`components/umami-analytics.tsx`) only loads when `NEXT_PUBLIC_UMAMI_WEBSITE_ID` is set, so it's a no-op in local development unless you configure it.

1. Create a site in [Umami Cloud](https://cloud.umami.is) (or your self-hosted instance) and copy its website ID.
2. Set `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (and `NEXT_PUBLIC_UMAMI_SCRIPT_URL` if self-hosting) in your environment.
3. Redeploy — pageviews will start showing up in your Umami dashboard.
