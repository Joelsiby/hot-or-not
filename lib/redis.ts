import { Redis } from '@upstash/redis';

// Reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN from the
// environment. Redis is optional — the app works fine off Postgres alone,
// just uncached — so this is null instead of throwing when it's unset.
// `Redis.fromEnv()` itself doesn't validate its config until a command
// actually runs, and then throws a raw fetch error ("Failed to parse URL
// from /pipeline") instead of something callers can sensibly catch, so we
// check the env vars ourselves up front.
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;
