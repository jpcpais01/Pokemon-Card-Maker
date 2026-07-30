import { NextResponse } from "next/server";
import { sanitizeRoomForPlayer } from "@/lib/battle/engine";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getRoom } from "@/lib/battle/rooms";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const playerId = searchParams.get("playerId");

  if (!code || !playerId) {
    return NextResponse.json({ error: "Missing code or playerId." }, { status: 400 });
  }

  const room = await getRoom(normalizeRoomCode(code));
  if (!room) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }
  if (!room.players.includes(playerId)) {
    return NextResponse.json({ error: "You are not part of this match." }, { status: 403 });
  }

  return NextResponse.json({ room: sanitizeRoomForPlayer(room, playerId) });
}
