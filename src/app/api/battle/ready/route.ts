import { NextResponse } from "next/server";
import { createRound, sanitizeRoomForPlayer } from "@/lib/battle/engine";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getRoom, saveRoom } from "@/lib/battle/rooms";
import { BATTLE_ROUNDS, BATTLE_REROLLS_PER_ROUND, isBotPlayerId } from "@/lib/battle/types";
import { fetchPokemonForGenerations } from "@/lib/generations";

export async function POST(request: Request) {
  let body: { code?: string; playerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { playerId } = body;
  if (!body.code || !playerId) {
    return NextResponse.json({ error: "Missing code or playerId." }, { status: 400 });
  }

  const code = normalizeRoomCode(body.code);
  const room = await getRoom(code);
  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });
  if (!room.players.includes(playerId)) {
    return NextResponse.json({ error: "You are not part of this match." }, { status: 403 });
  }

  const round = room.rounds[room.rounds.length - 1];
  if (!round || round.status !== "done") {
    return NextResponse.json({ error: "This round isn't finished yet." }, { status: 409 });
  }

  round.players[playerId].readyForNext = true;
  // Bots have no client polling to click "next round" for themselves - they're always ready.
  if (room.vsBot) {
    for (const pid of room.players) {
      if (isBotPlayerId(pid)) round.players[pid].readyForNext = true;
    }
  }

  if (Object.values(round.players).every((p) => p.readyForNext)) {
    if (room.round >= BATTLE_ROUNDS) {
      room.status = "finished";
    } else {
      const pool = await fetchPokemonForGenerations(room.gens);
      room.round += 1;
      const botIds = room.vsBot ? room.players.filter(isBotPlayerId) : [];
      room.rounds.push(createRound(room.players, pool, botIds, room.packMode));
      // Unused rerolls carry over - each new round just adds a fresh base allotment on top.
      for (const pid of room.players) {
        room.rerolls[pid] = (room.rerolls[pid] ?? 0) + BATTLE_REROLLS_PER_ROUND;
      }
    }
  }

  await saveRoom(room);
  return NextResponse.json({ room: sanitizeRoomForPlayer(room, playerId) });
}
