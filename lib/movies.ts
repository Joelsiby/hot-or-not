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
  // Ramayana: Part 1 (Ranbir Kapoor, Yash, Sai Pallavi) — Nitesh Tiwari's
  // two-part epic, releasing Diwali 2026.
  { slug: 'ramayana-part-1', title: 'Ramayana: Part 1', posterEmoji: '🏹', bannerUrl: '/banners/ramayana-part-1.jpg' },
  // King (Shah Rukh Khan) — releasing December 24, 2026.
  { slug: 'king', title: 'King', posterEmoji: '👑', bannerUrl: '/banners/king-2026.jpg' },
  // "Dacoit" here is Dacoit: A Love Story (2026).
  { slug: 'dacoit', title: 'Dacoit', posterEmoji: '🔫', bannerUrl: '/banners/dacoit.jpg' },
];

export function getMovie(slug: string): Movie | undefined {
  return movies.find((m) => m.slug === slug);
}
