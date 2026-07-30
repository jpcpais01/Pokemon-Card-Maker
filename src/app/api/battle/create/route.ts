import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { generateRoomCode } from "@/lib/battle/roomCode";
import { getRoom, saveRoom } from "@/lib/battle/rooms";
import { BATTLE_REROLLS_PER_ROUND } from "@/lib/battle/types";
import type { BattleRoom } from "@/lib/battle/types";

export async function POST(request: Request) {
  let body: { gens?: number[] };
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

  const playerId = randomUUID();
  const room: BattleRoom = {
    code,
    createdAt: Date.now(),
    status: "waiting",
    gens: body.gens,
    players: [playerId],
    scores: { [playerId]: 0 },
    rerolls: { [playerId]: BATTLE_REROLLS_PER_ROUND },
    round: 0,
    rounds: [],
  };

  await saveRoom(room);
  return NextResponse.json({ code, playerId });
}
