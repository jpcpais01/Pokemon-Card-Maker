import { NextResponse } from "next/server";
import { sanitizeRoomForPlayer } from "@/lib/battle/engine";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getRoom, saveRoom } from "@/lib/battle/rooms";

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
  if (!round || round.status !== "picking") {
    return NextResponse.json({ error: "This round is not accepting picks right now." }, { status: 409 });
  }

  round.players[playerId].locked = true;
  if (Object.values(round.players).every((p) => p.locked)) {
    round.status = "prompting";
  }

  await saveRoom(room);
  return NextResponse.json({ room: sanitizeRoomForPlayer(room, playerId) });
}
