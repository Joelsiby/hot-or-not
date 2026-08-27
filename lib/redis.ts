import { Redis } from '@upstash/redis';

// Reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN from the
// environment. `Redis.fromEnv()` doesn't fail fast when they're missing —
// it builds a client around an empty URL, which then throws a confusing
// "Failed to parse URL from /pipeline" on the first command instead of a
// clear "not configured" error. Null it out instead so lib/comments.ts can
// skip the cache entirely and go straight to Supabase/seed data, same
// "runs fine without this backend configured" fallback the rest of the
// app already has.
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;
