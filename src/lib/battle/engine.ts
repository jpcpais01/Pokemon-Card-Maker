import { ART_TYPES, REGIONS, SPECIAL_FORMS, pickSpecialForm, pickWeighted } from "@/lib/cardData";
import type { CardKey } from "@/lib/cardFaces";
import { pickRandomPokemon, toPokemonPick } from "@/lib/generations";
import type { PokemonRef } from "@/lib/types";
import type { BattlePlayerPick, BattleRoom, BattleRound, BattleRoundPlayerState } from "./types";

function rollPlayerPick(pool: PokemonRef[]): BattlePlayerPick {
  const artType = pickWeighted(ART_TYPES);
  const specialForm = pickSpecialForm(pool.length);
  const region = pickWeighted(REGIONS);
  const count = specialForm.value === "tag-team" ? 2 : 1;

  const chosenIds: number[] = [];
  const pokemons = [];
  for (let i = 0; i < count; i++) {
    const p = pickRandomPokemon(pool, chosenIds);
    chosenIds.push(p.id);
    pokemons.push(toPokemonPick(p));
  }

  return { artType, specialForm, region, pokemons };
}

/**
 * Creates a fresh round with a randomized pick for each player. When `botId` is given, that
 * player's pick is locked in immediately - the bot never rerolls, it just gets a randomized pick
 * with the exact same odds as anyone else and waits for the human to lock in.
 */
export function createRound(playerIds: string[], pool: PokemonRef[], botId?: string): BattleRound {
  const players: BattleRound["players"] = {};
  for (const pid of playerIds) {
    players[pid] = {
      ...rollPlayerPick(pool),
      locked: pid === botId,
      promptStatus: "pending",
      imageStatus: "pending",
      readyForNext: false,
    };
  }
  return { status: "picking", players };
}

export function rerollPlayerCard(
  state: BattleRoundPlayerState,
  key: CardKey,
  pool: PokemonRef[]
): BattleRoundPlayerState {
  if (key === "artType") {
    return { ...state, artType: pickWeighted(ART_TYPES, state.artType.value) };
  }
  if (key === "region") {
    return { ...state, region: pickWeighted(REGIONS, state.region.value) };
  }
  if (key === "specialForm") {
    const specialForm = pickSpecialForm(pool.length, state.specialForm.value);
    const wasTagTeam = state.specialForm.value === "tag-team";
    const isTagTeam = specialForm.value === "tag-team";

    let pokemons = state.pokemons;
    if (isTagTeam && !wasTagTeam) {
      const extra = pickRandomPokemon(
        pool,
        state.pokemons.map((p) => p.id)
      );
      pokemons = [...state.pokemons, toPokemonPick(extra)];
    } else if (!isTagTeam && wasTagTeam) {
      pokemons = state.pokemons.slice(0, 1);
    }
    return { ...state, specialForm, pokemons };
  }

  const excludeIds = state.pokemons.map((p) => p.id);
  const fresh = pickRandomPokemon(pool, excludeIds);
  const pokemons = [...state.pokemons];
  pokemons[key] = toPokemonPick(fresh);
  return { ...state, pokemons };
}

/** Innocuous placeholder shown in place of the opponent's still-hidden picks. */
const HIDDEN_PICK: BattlePlayerPick = {
  artType: ART_TYPES[0],
  specialForm: SPECIAL_FORMS[0],
  region: REGIONS[0],
  pokemons: [{ id: 0, name: "unknown", displayName: "???", artworkUrl: "" }],
};

/** Redacts the opponent's in-progress picks for the current round so nobody can peek before it's revealed. */
export function sanitizeRoomForPlayer(room: BattleRoom, playerId: string): BattleRoom {
  if (room.rounds.length === 0) return room;

  const lastIndex = room.rounds.length - 1;
  const lastRound = room.rounds[lastIndex];
  if (lastRound.status === "done") return room;

  const players: BattleRound["players"] = {};
  for (const [pid, state] of Object.entries(lastRound.players)) {
    players[pid] =
      pid === playerId
        ? state
        : {
            ...HIDDEN_PICK,
            locked: state.locked,
            promptStatus: state.promptStatus,
            imageStatus: state.imageStatus,
            readyForNext: state.readyForNext,
            hidden: true,
          };
  }

  const rounds = [...room.rounds];
  rounds[lastIndex] = { ...lastRound, players };
  return { ...room, rounds };
}
