import type { ArtType, PokemonPick, Region, SpecialForm, WeightedOption } from "@/lib/types";

export const BATTLE_ROUNDS = 5;
/** Granted at the start of every round, on top of whatever's left unused from the previous round. */
export const BATTLE_REROLLS_PER_ROUND = 5;

export type RoundStatus = "picking" | "prompting" | "imaging" | "judging" | "done";
export type RoomStatus = "waiting" | "playing" | "finished";

export interface BattlePlayerPick {
  artType: WeightedOption<ArtType>;
  specialForm: WeightedOption<SpecialForm>;
  region: WeightedOption<Region>;
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
}

export interface BattleRoom {
  code: string;
  createdAt: number;
  status: RoomStatus;
  gens: number[];
  /** Up to 2 player ids; index 0 is the host who created the room. */
  players: string[];
  scores: Record<string, number>;
  rerolls: Record<string, number>;
  /** 1-indexed; 0 before the match starts. */
  round: number;
  rounds: BattleRound[];
}
