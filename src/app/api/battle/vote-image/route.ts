import { NextResponse } from "next/server";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getImage, getRoom } from "@/lib/battle/rooms";

/**
 * Serves a candidate card's image for the voting phase by anonymous slot number instead of by
 * player id - the real target id never has to reach the client, so a voter genuinely can't learn
 * whose card is whose from network traffic, only from the room's normal player-id list once the
 * round ends and picks are revealed like usual.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const round = Number(searchParams.get("round"));
  const playerId = searchParams.get("playerId");
  const slot = Number(searchParams.get("slot"));

  if (!code || !playerId || !Number.isInteger(round) || round < 1 || !Number.isInteger(slot) || slot < 0) {
    return NextResponse.json({ error: "Missing or invalid parameters." }, { status: 400 });
  }

  const room = await getRoom(normalizeRoomCode(code));
  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });
  if (!room.players.includes(playerId)) {
    return NextResponse.json({ error: "You are not part of this match." }, { status: 403 });
  }

  const roundState = room.rounds[round - 1];
  if (!roundState || roundState.status !== "voting" || !roundState.vote) {
    return NextResponse.json({ error: "This round isn't accepting votes right now." }, { status: 409 });
  }

  const targetId = roundState.vote.order[playerId]?.[slot];
  if (!targetId) {
    return NextResponse.json({ error: "Invalid slot." }, { status: 400 });
  }

  const image = await getImage(room.code, round, targetId);
  if (!image) return NextResponse.json({ error: "Image not ready yet." }, { status: 404 });

  return NextResponse.json({ image });
}
