import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createRound } from "@/lib/battle/engine";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getRoom, saveRoom } from "@/lib/battle/rooms";
import { BATTLE_TOTAL_REROLLS } from "@/lib/battle/types";
import { fetchPokemonForGenerations } from "@/lib/generations";

export async function POST(request: Request) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.code) {
    return NextResponse.json({ error: "Missing room code." }, { status: 400 });
  }

  const code = normalizeRoomCode(body.code);
  const room = await getRoom(code);
  if (!room) {
    return NextResponse.json({ error: "Room not found. Check the code and try again." }, { status: 404 });
  }
  if (room.players.length >= 2) {
    return NextResponse.json({ error: "This room is already full." }, { status: 409 });
  }

  const playerId = randomUUID();
  room.players.push(playerId);
  room.scores[playerId] = 0;
  room.rerolls[playerId] = BATTLE_TOTAL_REROLLS;
  room.status = "playing";
  room.round = 1;

  const pool = await fetchPokemonForGenerations(room.gens);
  if (pool.length === 0) {
    return NextResponse.json({ error: "No Pokemon found for this room's generations." }, { status: 500 });
  }
  room.rounds = [createRound(room.players, pool)];

  await saveRoom(room);
  return NextResponse.json({ code, playerId });
}
