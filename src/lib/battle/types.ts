import type { CardRatings } from "@/lib/openrouter";
import type { ArtType, PackMode, PokemonPick, SpecialForm, Vibe, WeightedOption } from "@/lib/types";

export type { CardRatings, PackMode };

export const BATTLE_ROUNDS = 5;
/** Granted at the start of every round, on top of whatever's left unused from the previous round. */
export const BATTLE_REROLLS_PER_ROUND = 5;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
/** Fixed player ids standing in for CPU opponents in a vs-bot match - up to MAX_PLAYERS - 1 of
 *  these fill every non-host slot. */
export const BOT_PLAYER_IDS = ["bot-1", "bot-2", "bot-3"] as const;

export function isBotPlayerId(id: string): boolean {
  return (BOT_PLAYER_IDS as readonly string[]).includes(id);
}

export type RoundStatus = "picking" | "prompting" | "imaging" | "voting" | "judging" | "done";
export type RoomStatus = "waiting" | "playing" | "finished";
export type JudgeMode = "ai" | "vote";
/** Player-vote mode only makes sense with at least 2 candidates besides your own card. */
export const MIN_VOTE_PLAYERS = 3;

export interface BattlePlayerPick {
  artType: WeightedOption<ArtType>;
  specialForm: WeightedOption<SpecialForm>;
  vibe: WeightedOption<Vibe>;
  pokemons: PokemonPick[];
}

export interface BattleRoundPlayerState extends BattlePlayerPick {
  locked: boolean;
  promptStatus: "pending" | "ready" | "error";
  imageStatus: "pending" | "ready" | "error";
  prompt?: string;
  readyForNext: boolean;
  /** True when this is a redacted view of the *opponent's* still-in-progress picks. */
  hidden?: boolean;
}

/** Raw per-round voting state - server/internal only, always stripped before reaching a client. */
export interface BattleRoundVoteState {
  /** voterId -> shuffled list of candidate player ids (excludes their own), stable for the round. */
  order: Record<string, string[]>;
  /** voterId -> the target player id they voted for. */
  votes: Record<string, string>;
}

/** Client-safe view of the current player's own voting status - built by sanitizeRoomForPlayer. */
export interface VoteStatusView {
  /** How many anonymous candidate slots this voter has to choose among. */
  slotCount: number;
  /** Slot index this voter chose, or null if they haven't voted yet. */
  myVote: number | null;
  votedCount: number;
  totalVoters: number;
}

export interface BattleRound {
  status: RoundStatus;
  players: Record<string, BattleRoundPlayerState>;
  winnerId?: string | null;
  verdict?: string;
  /** Judge's 4-aspect ratings for each player's card, keyed by playerId. Only used in "ai" judge mode. */
  ratings?: Record<string, CardRatings>;
  /** Final vote tally per playerId, revealed once the round is done. Only used in "vote" judge mode. */
  voteCounts?: Record<string, number>;
  /** Raw voting state - never sent to a client; see sanitizeRoomForPlayer. */
  vote?: BattleRoundVoteState;
  /** Client-facing voting status - populated only by sanitizeRoomForPlayer, only while voting. */
  voteStatus?: VoteStatusView;
}

export interface BattleRoom {
  code: string;
  createdAt: number;
  status: RoomStatus;
  gens: number[];
  /** Room fills up to this many player ids; index 0 is the host who created the room. */
  maxPlayers: number;
  players: string[];
  scores: Record<string, number>;
  rerolls: Record<string, number>;
  /** 1-indexed; 0 before the match starts. */
  round: number;
  rounds: BattleRound[];
  /** True when every non-host slot (BOT_PLAYER_IDS) is filled by the CPU rather than real players. */
  vsBot?: boolean;
  /** "ai" (default) has an LLM judge each round; "vote" has every player vote anonymously instead. */
  judgeMode?: JudgeMode;
  /** vs-bot only - when true, rerolls are never checked or spent, so every player has infinite rerolls. */
  unlimitedRerolls?: boolean;
  /** "classic" (default) leaves art type and special form random; "sir"/"tagteam" force every
   *  player's artType/specialForm for the whole match, matching solo mode's forced-trait packs. */
  packMode?: PackMode;
}
