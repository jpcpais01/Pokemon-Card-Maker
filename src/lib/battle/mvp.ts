import { ratingsTotal } from "./tier";
import type { BattleRoom } from "./types";

export interface MvpResult {
  playerId: string;
  /** 1-indexed. */
  round: number;
  scoreLabel: string;
}

/**
 * Finds the single best-scoring card across the whole match - highest AI ratings total in "ai"
 * judge mode, most votes in "vote" mode. A match only ever uses one judge mode for its full
 * duration, so the two scoring units are never compared against each other here.
 */
export function computeMvp(room: BattleRoom): MvpResult | null {
  let best: MvpResult | null = null;
  let bestScore = -Infinity;

  room.rounds.forEach((round, i) => {
    const roundNumber = i + 1;

    if (round.ratings) {
      for (const [pid, ratings] of Object.entries(round.ratings)) {
        const score = ratingsTotal(ratings);
        if (score > bestScore) {
          bestScore = score;
          best = { playerId: pid, round: roundNumber, scoreLabel: `${score}/40 rating` };
        }
      }
    } else if (round.voteCounts) {
      for (const [pid, count] of Object.entries(round.voteCounts)) {
        if (count > bestScore) {
          bestScore = count;
          best = { playerId: pid, round: roundNumber, scoreLabel: `${count} vote${count === 1 ? "" : "s"}` };
        }
      }
    }
  });

  return best;
}
