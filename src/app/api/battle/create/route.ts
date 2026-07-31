import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createRound } from "@/lib/battle/engine";
import { generateRoomCode } from "@/lib/battle/roomCode";
import { getRoom, saveRoom } from "@/lib/battle/rooms";
import { BATTLE_REROLLS_PER_ROUND, BOT_PLAYER_ID } from "@/lib/battle/types";
import type { BattleRoom } from "@/lib/battle/types";
import { fetchPokemonForGenerations } from "@/lib/generations";

export async function POST(request: Request) {
  let body: { gens?: number[]; vsBot?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.gens) || body.gens.length === 0) {
    return NextResponse.json({ error: "Select at least one generation." }, { status: 400 });
  }

  let code = generateRoomCode();
  for (let attempt = 0; attempt < 5 && (await getRoom(code)); attempt++) {
    code = generateRoomCode();
  }

  const vsBot = body.vsBot === true;
  const playerId = randomUUID();
  const players = vsBot ? [playerId, BOT_PLAYER_ID] : [playerId];

  const room: BattleRoom = {
    code,
    createdAt: Date.now(),
    status: vsBot ? "playing" : "waiting",
    gens: body.gens,
    players,
    scores: Object.fromEntries(players.map((pid) => [pid, 0])),
    rerolls: Object.fromEntries(players.map((pid) => [pid, BATTLE_REROLLS_PER_ROUND])),
    round: vsBot ? 1 : 0,
    rounds: [],
    vsBot,
  };

  if (vsBot) {
    const pool = await fetchPokemonForGenerations(body.gens);
    if (pool.length === 0) {
      return NextResponse.json({ error: "No Pokemon found for the selected generations." }, { status: 500 });
    }
    room.rounds = [createRound(players, pool, BOT_PLAYER_ID)];
  }

  await saveRoom(room);
  return NextResponse.json({ code, playerId });
}
