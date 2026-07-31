import { ART_TYPES, SPECIAL_FORMS, pickSpecialForm, pickWeighted } from "@/lib/cardData";
import type { CardKey } from "@/lib/cardFaces";
import { pickRandomPokemon, toPokemonPick } from "@/lib/generations";
import type { PokemonRef } from "@/lib/types";
import type { BattlePlayerPick, BattleRoom, BattleRound, BattleRoundPlayerState } from "./types";

function rollPlayerPick(pool: PokemonRef[]): BattlePlayerPick {
  const artType = pickWeighted(ART_TYPES);
  const specialForm = pickSpecialForm(pool.length);
  const count = specialForm.value === "tag-team" ? 2 : 1;

  const chosenIds: number[] = [];
  const pokemons = [];
  for (let i = 0; i < count; i++) {
    const p = pickRandomPokemon(pool, chosenIds);
    chosenIds.push(p.id);
    pokemons.push(toPokemonPick(p));
  }

  return { artType, specialForm, pokemons };
}

/**
 * Creates a fresh round with a randomized pick for each player. Any player id listed in `botIds`
 * has their pick locked in immediately - a bot never rerolls, it just gets a randomized pick with
 * the exact same odds as anyone else and waits for the humans to lock in.
 */
export function createRound(playerIds: string[], pool: PokemonRef[], botIds: readonly string[] = []): BattleRound {
  const players: BattleRound["players"] = {};
  for (const pid of playerIds) {
    players[pid] = {
      ...rollPlayerPick(pool),
      locked: botIds.includes(pid),
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

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Builds each player's personal, independently-shuffled voting order over the candidate cards
 * (everyone with a ready image, excluding their own) - so no player ever sees their own card, and
 * a given card doesn't land in the same slot for every voter or from one round to the next.
 */
export function buildVoteOrders(pids: string[], candidatePids: string[]): Record<string, string[]> {
  const order: Record<string, string[]> = {};
  for (const pid of pids) {
    order[pid] = shuffle(candidatePids.filter((cid) => cid !== pid));
  }
  return order;
}

/** Innocuous placeholder shown in place of the opponent's still-hidden picks. */
const HIDDEN_PICK: BattlePlayerPick = {
  artType: ART_TYPES[0],
  specialForm: SPECIAL_FORMS[0],
  pokemons: [{ id: 0, name: "unknown", displayName: "???", artworkUrl: "" }],
};

/**
 * Builds the requesting player's own view of the round's voting state - never the raw order/votes
 * maps (those would leak who voted for whom, and every voter's real card identities, to any
 * client that received them), just what that one player needs to render their ballot.
 */
function buildVoteStatusView(
  vote: BattleRound["vote"],
  playerId: string,
  totalVoters: number
): BattleRound["voteStatus"] {
  if (!vote) return undefined;
  const myOrder = vote.order[playerId] ?? [];
  const myTarget = vote.votes[playerId];
  return {
    slotCount: myOrder.length,
    myVote: myTarget ? myOrder.indexOf(myTarget) : null,
    votedCount: Object.keys(vote.votes).length,
    totalVoters,
  };
}

/**
 * Redacts the opponent's in-progress picks for the current round so nobody can peek before it's
 * revealed, and always strips the raw voting order/votes maps down to this player's own ballot -
 * in every round status, including "done", since who-voted-for-whom stays private forever even
 * after the round's picks themselves are revealed.
 */
export function sanitizeRoomForPlayer(room: BattleRoom, playerId: string): BattleRoom {
  if (room.rounds.length === 0) return room;

  const lastIndex = room.rounds.length - 1;
  const lastRound = room.rounds[lastIndex];
  const voteStatus = buildVoteStatusView(lastRound.vote, playerId, room.players.length);

  if (lastRound.status === "done") {
    if (!lastRound.vote) return room;
    const rounds = [...room.rounds];
    rounds[lastIndex] = { ...lastRound, vote: undefined, voteStatus };
    return { ...room, rounds };
  }

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
  rounds[lastIndex] = { ...lastRound, players, vote: undefined, voteStatus };
  return { ...room, rounds };
}
