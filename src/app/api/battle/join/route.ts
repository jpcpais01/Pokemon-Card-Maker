import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createRound } from "@/lib/battle/engine";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getRoom, lockKey, saveRoom } from "@/lib/battle/rooms";
import { acquireLock, releaseLock } from "@/lib/battle/store";
import { BATTLE_REROLLS_PER_ROUND } from "@/lib/battle/types";
import { fetchPokemonForGenerations } from "@/lib/generations";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  // With up to 4 players able to join the same room in quick succession, an unlocked
  // read-modify-write here could let two joins race and silently clobber each other (one
  // player's seat vanishing). Lock the room for the brief moment it takes to add a seat.
  let gotLock = false;
  for (let attempt = 0; attempt < 5 && !gotLock; attempt++) {
    gotLock = await acquireLock(lockKey(code), 10);
    if (!gotLock) await sleep(150);
  }
  if (!gotLock) {
    return NextResponse.json({ error: "Room is busy right now - try again." }, { status: 409 });
  }

  try {
    const room = await getRoom(code);
    if (!room) {
      return NextResponse.json({ error: "Room not found. Check the code and try again." }, { status: 404 });
    }
    if (room.status !== "waiting" || room.players.length >= room.maxPlayers) {
      return NextResponse.json({ error: "This room is already full." }, { status: 409 });
    }

    const playerId = randomUUID();
    room.players.push(playerId);
    room.scores[playerId] = 0;
    room.rerolls[playerId] = BATTLE_REROLLS_PER_ROUND;

    // Only actually start the match once every seat is filled - otherwise stay "waiting" for more.
    if (room.players.length === room.maxPlayers) {
      room.status = "playing";
      room.round = 1;

      const pool = await fetchPokemonForGenerations(room.gens);
      if (pool.length === 0) {
        return NextResponse.json({ error: "No Pokemon found for this room's generations." }, { status: 500 });
      }
      if ((room.packMode === "tagteam" || room.packMode === "tagteamsir") && pool.length < 2) {
        return NextResponse.json(
          { error: "Need at least 2 Pokemon in this room's generations for a Tag Team." },
          { status: 500 }
        );
      }
      room.rounds = [createRound(room.players, pool, [], room.packMode)];
    }

    await saveRoom(room);
    return NextResponse.json({ code, playerId });
  } finally {
    await releaseLock(lockKey(code));
  }
}
