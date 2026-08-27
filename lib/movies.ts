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
  { slug: 'kalki-2', title: 'Kalki 2', posterEmoji: '🪐' },
  { slug: 'pushpa-3', title: 'Pushpa 3', posterEmoji: '🌿' },
  { slug: 'dacoit', title: 'Dacoit', posterEmoji: '🔫' },
];

export function getMovie(slug: string): Movie | undefined {
  return movies.find((m) => m.slug === slug);
}
