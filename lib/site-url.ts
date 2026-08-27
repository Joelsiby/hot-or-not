// NEXT_PUBLIC_SITE_URL is the source of truth. Vercel sets VERCEL_URL on every
// deployment automatically, so previews still use their deployment URL.
export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL && process.env.VERCEL_ENV !== 'production') {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'https://www.bhosdike.lol';
}
