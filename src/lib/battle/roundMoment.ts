import { ratingsTotal } from "./tier";
import type { BattleRound, CardRatings } from "./types";

/**
 * The five things a round can be remembered for. Each one gets its own animated card between the
 * scorecard and the winner reveal (see RoundMoment.tsx).
 *
 * "verdict" is the catch-all: it fires on an ordinary round where nothing above it triggered, so
 * there is always exactly one moment to show rather than an interstitial that sometimes appears
 * and sometimes doesn't.
 */
export type RoundMomentKind = "clean-sweep" | "photo-finish" | "perfect-ten" | "landslide" | "verdict";

export interface RoundMoment {
  kind: RoundMomentKind;
  title: string;
  /** One line naming what actually triggered it, so the card is never just a label. */
  detail: string;
}

const ASPECT_KEYS = ["art", "fame", "chase", "rarity"] as const;

const ASPECT_LABELS: Record<(typeof ASPECT_KEYS)[number], string> = {
  art: "Art",
  fame: "Fame",
  chase: "Chase",
  rarity: "Rarity",
};

/** Top of the 1-10 scale each aspect is scored on. */
const PERFECT_SCORE = 10;
/** At or under this, the round was close enough to be worth calling out as one. */
const PHOTO_FINISH_MARGIN = 1;
/** At or over this, it stopped being a contest. Sits above the 4 a clean sweep is worth on its
 *  own, since a round that swept every category is announced as a sweep rather than a rout. */
const LANDSLIDE_MARGIN = 5;

/**
 * Picks the one moment that best describes how this round was won.
 *
 * Deliberately a pure function of the finished round: every player's client runs it over the same
 * `round` object, so the whole table sees the same card at the same point in the reveal without
 * anything extra having to be sent or agreed on.
 *
 * Order matters - the checks run rarest-first, so a round that qualifies for several is announced
 * as the most remarkable of them.
 */
export function pickRoundMoment(round: BattleRound): RoundMoment | null {
  if (!round.winnerId) return null;
  if (round.ratings) return fromRatings(round.ratings, round.winnerId);
  if (round.voteCounts) return fromVotes(round.voteCounts, round.winnerId);
  return null;
}

/** AI-judge rounds, where every card carries four 1-10 aspect scores. */
function fromRatings(all: Record<string, CardRatings>, winnerId: string): RoundMoment | null {
  const winner = all[winnerId];
  if (!winner) return null;
  const others = Object.entries(all)
    .filter(([id]) => id !== winnerId)
    .map(([, ratings]) => ratings);
  if (others.length === 0) return null;

  const margin = ratingsTotal(winner) - Math.max(...others.map(ratingsTotal));

  // Beaten outright in all four - a tie on any single category is not a sweep.
  if (ASPECT_KEYS.every((key) => others.every((other) => winner[key] > other[key]))) {
    return {
      kind: "clean-sweep",
      title: "Clean Sweep",
      detail: "Top of all four categories",
    };
  }

  // Checked before the perfect score: a one-point finish is the more dramatic of the two, and a
  // sweep is worth 4 or more, so this can never contradict the branch above.
  if (margin <= PHOTO_FINISH_MARGIN) {
    return {
      kind: "photo-finish",
      title: "Photo Finish",
      detail: margin <= 0 ? "Level on points - taken on the tiebreak" : "Ahead by a single point",
    };
  }

  const perfect = ASPECT_KEYS.filter((key) => winner[key] === PERFECT_SCORE);
  if (perfect.length > 0) {
    const names = perfect.map((key) => ASPECT_LABELS[key]);
    return {
      kind: "perfect-ten",
      title: "Perfect 10",
      detail: names.length === 1 ? `Full marks for ${names[0]}` : `Full marks for ${listOut(names)}`,
    };
  }

  if (margin >= LANDSLIDE_MARGIN) {
    return { kind: "landslide", title: "Landslide", detail: `Clear by ${margin} points` };
  }

  return { kind: "verdict", title: "The Verdict", detail: `Taken by ${margin} points` };
}

/** Player-vote rounds, where the only signal is how the ballots fell. */
function fromVotes(counts: Record<string, number>, winnerId: string): RoundMoment | null {
  const winnerVotes = counts[winnerId] ?? 0;
  const others = Object.entries(counts)
    .filter(([id]) => id !== winnerId)
    .map(([, count]) => count);
  if (others.length === 0) return null;

  const cast = winnerVotes + others.reduce((sum, count) => sum + count, 0);
  const margin = winnerVotes - Math.max(...others);

  if (cast >= 2 && winnerVotes === cast) {
    return { kind: "clean-sweep", title: "Clean Sweep", detail: "Every single vote at the table" };
  }
  if (margin <= PHOTO_FINISH_MARGIN) {
    return {
      kind: "photo-finish",
      title: "Photo Finish",
      detail: margin <= 0 ? "Split down the middle - taken on the tiebreak" : "Ahead by one vote",
    };
  }
  // Proportional rather than a flat margin: "twice as many as anyone else" means the same thing
  // at a table of four as it does at a table of ten, where a fixed threshold would not.
  if (winnerVotes >= 2 * Math.max(...others)) {
    return { kind: "landslide", title: "Landslide", detail: `${winnerVotes} of ${cast} votes` };
  }

  return { kind: "verdict", title: "The Verdict", detail: `${winnerVotes} of ${cast} votes` };
}

function listOut(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
