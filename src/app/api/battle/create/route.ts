import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createRound } from "@/lib/battle/engine";
import { generateRoomCode } from "@/lib/battle/roomCode";
import { getRoom, saveRoom } from "@/lib/battle/rooms";
import {
  BATTLE_REROLLS_PER_ROUND,
  BOT_PLAYER_IDS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  MIN_VOTE_PLAYERS,
} from "@/lib/battle/types";
import type { BattleRoom, JudgeMode } from "@/lib/battle/types";
import { fetchPokemonForGenerations } from "@/lib/generations";

export async function POST(request: Request) {
  let body: { gens?: number[]; vsBot?: boolean; maxPlayers?: number; judgeMode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.gens) || body.gens.length === 0) {
    return NextResponse.json({ error: "Select at least one generation." }, { status: 400 });
  }

  const maxPlayers = Number.isInteger(body.maxPlayers) ? (body.maxPlayers as number) : MIN_PLAYERS;
  if (maxPlayers < MIN_PLAYERS || maxPlayers > MAX_PLAYERS) {
    return NextResponse.json({ error: `Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}.` }, { status: 400 });
  }

  const judgeMode: JudgeMode = body.judgeMode === "vote" ? "vote" : "ai";
  if (judgeMode === "vote" && maxPlayers < MIN_VOTE_PLAYERS) {
    return NextResponse.json({ error: `Player vote mode needs at least ${MIN_VOTE_PLAYERS} players.` }, { status: 400 });
  }

  let code = generateRoomCode();
  for (let attempt = 0; attempt < 5 && (await getRoom(code)); attempt++) {
    code = generateRoomCode();
  }

  const vsBot = body.vsBot === true;
  const playerId = randomUUID();
  const botIds = vsBot ? BOT_PLAYER_IDS.slice(0, maxPlayers - 1) : [];
  const players = vsBot ? [playerId, ...botIds] : [playerId];

  const room: BattleRoom = {
    code,
    createdAt: Date.now(),
    status: vsBot ? "playing" : "waiting",
    gens: body.gens,
    maxPlayers,
    players,
    scores: Object.fromEntries(players.map((pid) => [pid, 0])),
    rerolls: Object.fromEntries(players.map((pid) => [pid, BATTLE_REROLLS_PER_ROUND])),
    round: vsBot ? 1 : 0,
    rounds: [],
    vsBot,
    judgeMode,
  };

  if (vsBot) {
    const pool = await fetchPokemonForGenerations(body.gens);
    if (pool.length === 0) {
      return NextResponse.json({ error: "No Pokemon found for the selected generations." }, { status: 500 });
    }
    room.rounds = [createRound(players, pool, botIds)];
  }

  await saveRoom(room);
  return NextResponse.json({ code, playerId });
}
