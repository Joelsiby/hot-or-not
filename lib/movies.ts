export interface Movie {
  slug: string;
  title: string;
  posterEmoji: string;
  // Optional real poster image (served from public/banners/), used for
  // the small circular avatar next to the title and the movie chip
  // thumbnail. Falls back to posterEmoji wherever this is unset.
  bannerUrl?: string;
}

// Static for now — add a movie here and it shows up in the sidebar and
// becomes selectable immediately. Toxic is first, so it's the default
// selection on load.
export const movies: Movie[] = [
  { slug: 'toxic', title: 'Toxic', posterEmoji: '🔥', bannerUrl: '/banners/banner.jpg' },
  // "Kalki 2" isn't an official title yet — this is Kalki 2898 AD (2024),
  // the closest real released film.
  { slug: 'kalki-2', title: 'Kalki 2', posterEmoji: '🪐', bannerUrl: '/banners/kalki-2898-ad.jpg' },
  // Pushpa 3: The Rampage hasn't released — no real poster exists yet
  // (only a generic franchise logo), so this stays on the emoji rather
  // than use a mismatched image.
  { slug: 'pushpa-3', title: 'Pushpa 3', posterEmoji: '🌿' },
  // "Dacoit" here is Dacoit: A Love Story (2026).
  { slug: 'dacoit', title: 'Dacoit', posterEmoji: '🔫', bannerUrl: '/banners/dacoit.jpg' },
];

export function getMovie(slug: string): Movie | undefined {
  return movies.find((m) => m.slug === slug);
}
