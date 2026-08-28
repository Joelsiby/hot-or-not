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
  { slug: 'toxic', title: 'Toxic', posterEmoji: '🔥', bannerUrl: '/banners/toxic-2026.jpg' },
  // Mirzapur: The Movie (Pankaj Tripathi, Ali Fazal, Divyenndu) — releasing
  // September 4, 2026.
  { slug: 'mirzapur-the-movie', title: 'Mirzapur: The Movie', posterEmoji: '🏙️', bannerUrl: '/banners/mirzapur-the-movie.jpg' },
  // King (Shah Rukh Khan) — releasing December 24, 2026.
  { slug: 'king', title: 'King', posterEmoji: '👑', bannerUrl: '/banners/king-2026.jpg' },
  // "Dacoit" here is Dacoit: A Love Story (2026).
  { slug: 'dacoit', title: 'Dacoit', posterEmoji: '🔫', bannerUrl: '/banners/dacoit.jpg' },
  // Bethlehem Kudumba Unit (Nivin Pauly, Mamitha Baiju) — Malayalam
  // rom-com, released August 21, 2026.
  { slug: 'bethlehem-kudumba-unit', title: 'Bethlehem Kudumba Unit', posterEmoji: '💒', bannerUrl: '/banners/bethlehem-kudumba-unit.jpg' },
];

export function getMovie(slug: string): Movie | undefined {
  return movies.find((m) => m.slug === slug);
}
