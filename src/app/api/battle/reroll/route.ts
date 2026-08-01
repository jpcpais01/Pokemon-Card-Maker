import { NextResponse } from "next/server";
import type { CardKey } from "@/lib/cardFaces";
import { rerollPlayerCard, sanitizeRoomForPlayer } from "@/lib/battle/engine";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getRoom, saveRoom } from "@/lib/battle/rooms";
import { fetchPokemonForGenerations } from "@/lib/generations";

export async function POST(request: Request) {
  let body: { code?: string; playerId?: string; cardKey?: CardKey };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { playerId, cardKey } = body;
  if (!body.code || !playerId || (cardKey !== "artType" && cardKey !== "specialForm" && typeof cardKey !== "number")) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  const code = normalizeRoomCode(body.code);
  const room = await getRoom(code);
  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });
  if (!room.players.includes(playerId)) {
    return NextResponse.json({ error: "You are not part of this match." }, { status: 403 });
  }

  const round = room.rounds[room.rounds.length - 1];
  if (!round || round.status !== "picking") {
    return NextResponse.json({ error: "Rerolls are only available while picking." }, { status: 409 });
  }
  const playerState = round.players[playerId];
  if (!playerState || playerState.locked) {
    return NextResponse.json({ error: "You've already locked in this round." }, { status: 409 });
  }
  if (!room.unlimitedRerolls && (room.rerolls[playerId] ?? 0) <= 0) {
    return NextResponse.json({ error: "No rerolls left." }, { status: 409 });
  }
  if (typeof cardKey === "number" && !playerState.pokemons[cardKey]) {
    return NextResponse.json({ error: "Invalid card slot." }, { status: 400 });
  }

  const pool = await fetchPokemonForGenerations(room.gens);
  round.players[playerId] = rerollPlayerCard(playerState, cardKey, pool);
  if (!room.unlimitedRerolls) room.rerolls[playerId] -= 1;

  await saveRoom(room);
  return NextResponse.json({ room: sanitizeRoomForPlayer(room, playerId) });
}
