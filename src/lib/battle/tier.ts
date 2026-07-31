import type { CardRatings } from "./types";

/** Ordered highest-first; the first threshold the total clears wins. */
const TIER_THRESHOLDS: { min: number; label: string }[] = [
  { min: 36, label: "S" },
  { min: 34, label: "A+" },
  { min: 32, label: "A" },
  { min: 30, label: "A-" },
  { min: 28, label: "B+" },
  { min: 26, label: "B" },
  { min: 24, label: "B-" },
  { min: 22, label: "C+" },
  { min: 20, label: "C" },
  { min: 16, label: "C-" },
  { min: 11, label: "D" },
  { min: 0, label: "F" },
];

export function ratingsTotal(ratings: CardRatings): number {
  return ratings.art + ratings.fame + ratings.chase + ratings.rarity;
}

/** Maps a raw 0-40 total to its letter tier - exported separately so callers animating a
 *  climbing total (e.g. mid-growth in a bar chart) can look up the tier for any in-between value. */
export function tierForTotal(total: number): string {
  for (const { min, label } of TIER_THRESHOLDS) {
    if (total >= min) return label;
  }
  return "F";
}

/** Collapses the 4 category ratings (each 1-10, so 4-40 total) into a single letter tier. */
export function ratingsTier(ratings: CardRatings): string {
  return tierForTotal(ratingsTotal(ratings));
}
