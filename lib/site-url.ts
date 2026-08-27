// NEXT_PUBLIC_SITE_URL is the source of truth (set it to your production
// domain once you have one), but Vercel sets VERCEL_URL on every deployment
// automatically — falling back to it means preview/production deploys work
// out of the box even before you've configured a custom domain.
export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}
