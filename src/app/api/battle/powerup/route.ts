import { NextResponse } from "next/server";
import { canPlayPowerup, playPowerup, sanitizeRoomForPlayer } from "@/lib/battle/engine";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getRoom, saveRoom } from "@/lib/battle/rooms";
import { isPowerupId } from "@/lib/battle/types";

/** Plays one of the caller's power-ups for the current round. There is no way to take it back. */
export async function POST(request: Request) {
  let body: { code?: string; playerId?: string; powerup?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { playerId } = body;
  if (!body.code || !playerId || !isPowerupId(body.powerup)) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  const room = await getRoom(normalizeRoomCode(body.code));
  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });
  if (!room.players.includes(playerId)) {
    return NextResponse.json({ error: "You are not part of this match." }, { status: 403 });
  }

  const round = room.rounds[room.rounds.length - 1];
  if (!round) return NextResponse.json({ error: "No round in progress." }, { status: 409 });

  const problem = canPlayPowerup(room, round, playerId, body.powerup);
  if (problem) return NextResponse.json({ error: problem }, { status: 409 });

  playPowerup(room, round, playerId, body.powerup);
  await saveRoom(room);

  return NextResponse.json({ room: sanitizeRoomForPlayer(room, playerId) });
}
