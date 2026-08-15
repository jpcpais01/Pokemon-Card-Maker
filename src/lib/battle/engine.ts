import { ART_TYPES, SPECIAL_FORMS, VIBES, pickSpecialForm, pickWeighted, pokemonCountForSpecialForm } from "@/lib/cardData";
import type { CardKey } from "@/lib/cardFaces";
import { pickRandomPokemon, toPokemonPick } from "@/lib/generations";
import type { PackMode, PokemonPick, PokemonRef } from "@/lib/types";
import type {
  BattlePlayerPick,
  BattleRoom,
  BattleRound,
  BattleRoundPlayerState,
  PowerupId,
} from "./types";

function rollPlayerPick(pool: PokemonRef[], packMode: PackMode): BattlePlayerPick {
  const artType =
    packMode === "sir" || packMode === "tagteamsir" || packMode === "tripletagteamsir"
      ? ART_TYPES.find((a) => a.value === "special-illustration-rare")!
      : pickWeighted(ART_TYPES);
  const specialForm =
    packMode === "tagteam" || packMode === "tagteamsir"
      ? SPECIAL_FORMS.find((f) => f.value === "tag-team")!
      : packMode === "tripletagteamsir"
        ? SPECIAL_FORMS.find((f) => f.value === "triple-tag-team")!
        : pickSpecialForm(pool.length);
  const vibe = pickWeighted(VIBES);
  const count = pokemonCountForSpecialForm(specialForm.value);

  const chosenIds: number[] = [];
  const pokemons = [];
  for (let i = 0; i < count; i++) {
    const p = pickRandomPokemon(pool, chosenIds);
    chosenIds.push(p.id);
    pokemons.push(toPokemonPick(p));
  }

  return { artType, specialForm, vibe, pokemons };
}

/**
 * Creates a fresh round with a randomized pick for each player. Any player id listed in `botIds`
 * has their pick locked in immediately - a bot never rerolls, it just gets a randomized pick with
 * the exact same odds as anyone else and waits for the humans to lock in.
 */
export function createRound(
  playerIds: string[],
  pool: PokemonRef[],
  botIds: readonly string[] = [],
  packMode: PackMode = "classic"
): BattleRound {
  const players: BattleRound["players"] = {};
  for (const pid of playerIds) {
    players[pid] = {
      ...rollPlayerPick(pool, packMode),
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
  if (key === "vibe") {
    return { ...state, vibe: pickWeighted(VIBES, state.vibe.value) };
  }
  if (key === "specialForm") {
    const specialForm = pickSpecialForm(pool.length, state.specialForm.value);
    const prevCount = pokemonCountForSpecialForm(state.specialForm.value);
    const nextCount = pokemonCountForSpecialForm(specialForm.value);

    let pokemons = state.pokemons;
    if (nextCount > prevCount) {
      const extra: PokemonPick[] = [];
      const excludeIds = state.pokemons.map((p) => p.id);
      for (let i = prevCount; i < nextCount; i++) {
        const p = pickRandomPokemon(pool, [...excludeIds, ...extra.map((e) => e.id)]);
        extra.push(toPokemonPick(p));
      }
      pokemons = [...state.pokemons, ...extra];
    } else if (nextCount < prevCount) {
      pokemons = state.pokemons.slice(0, nextCount);
    }
    return { ...state, specialForm, pokemons };
  }

  const excludeIds = state.pokemons.map((p) => p.id);
  const fresh = pickRandomPokemon(pool, excludeIds);
  const pokemons = [...state.pokemons];
  pokemons[key] = toPokemonPick(fresh);
  return { ...state, pokemons };
}

/*
 * ---------------------------------------------------------------------------
 * Power-ups
 * ---------------------------------------------------------------------------
 * Every rule below is enforced on the server, from the stored room. The client shows what is
 * available and what is spent, but it is never the authority on either - a player holding one of
 * each for the match, and one play per round, has to survive a hand-written request too.
 */

/** The power-ups this player has left to spend, in the order they're presented. */
export function availablePowerups(room: BattleRoom, playerId: string): PowerupId[] {
  const spent = room.powerupsUsed?.[playerId] ?? [];
  return (["double-down", "top-tier", "deep-dive"] as PowerupId[]).filter((id) => !spent.includes(id));
}

/** The one this player played this round, if any. */
export function activePowerup(round: BattleRound, playerId: string): PowerupId | undefined {
  return round.powerups?.[playerId];
}

/**
 * Records a power-up as played and applies whatever takes effect immediately.
 *
 * Only "top-tier" changes anything at play time - it rewrites the pick's art type on the spot, so
 * the player sees the card they were promised rather than being told it will matter later. The
 * other two are read where they actually bite: rerolls in the reroll route, doubling at scoring.
 *
 * Callers must check `canPlayPowerup` first; this assumes the play is legal.
 */
export function playPowerup(room: BattleRoom, round: BattleRound, playerId: string, id: PowerupId): void {
  room.powerupsUsed ??= {};
  room.powerupsUsed[playerId] = [...(room.powerupsUsed[playerId] ?? []), id];
  round.powerups ??= {};
  round.powerups[playerId] = id;

  if (id === "top-tier") {
    const state = round.players[playerId];
    if (state) {
      state.artType = ART_TYPES.find((a) => a.value === "special-illustration-rare")!;
    }
  }
}

/** Why this play is not allowed, or null if it is. */
export function canPlayPowerup(
  room: BattleRoom,
  round: BattleRound,
  playerId: string,
  id: PowerupId
): string | null {
  if (round.status !== "picking") return "Power-ups can only be played while picking.";
  const state = round.players[playerId];
  if (!state) return "You are not in this round.";
  if (state.locked) return "You've already locked in this round.";
  if (activePowerup(round, playerId)) return "You've already played a power-up this round.";
  if (!availablePowerups(room, playerId).includes(id)) return "You've already used that power-up.";
  return null;
}

/**
 * Credits the round win, doubled if that player backed themselves with Double Down.
 *
 * Shared by all three places a round can be decided - the AI judge, the judge's fallback path,
 * and player voting - because a power-up that only paid out on some of them would be a bug the
 * player pays for.
 */
export function awardRoundWin(room: BattleRoom, round: BattleRound, winnerId: string): void {
  const points = activePowerup(round, winnerId) === "double-down" ? 2 : 1;
  room.scores[winnerId] = (room.scores[winnerId] ?? 0) + points;
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
  vibe: VIBES[0],
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
