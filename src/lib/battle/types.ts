import type { CardRatings } from "@/lib/openrouter";
import type { ArtType, PokemonPick, SpecialForm, WeightedOption } from "@/lib/types";

export type { CardRatings };

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

export type RoundStatus = "picking" | "prompting" | "imaging" | "judging" | "done";
export type RoomStatus = "waiting" | "playing" | "finished";

export interface BattlePlayerPick {
  artType: WeightedOption<ArtType>;
  specialForm: WeightedOption<SpecialForm>;
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

export interface BattleRound {
  status: RoundStatus;
  players: Record<string, BattleRoundPlayerState>;
  winnerId?: string | null;
  verdict?: string;
  /** Judge's 4-aspect ratings for each player's card, keyed by playerId. */
  ratings?: Record<string, CardRatings>;
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
}
