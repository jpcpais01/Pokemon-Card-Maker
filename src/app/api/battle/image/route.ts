import { NextResponse } from "next/server";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getImage, getRoom } from "@/lib/battle/rooms";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const round = Number(searchParams.get("round"));
  const playerId = searchParams.get("playerId");
  const requesterId = searchParams.get("requesterId");

  if (!code || !playerId || !requesterId || !Number.isInteger(round) || round < 1) {
    return NextResponse.json({ error: "Missing or invalid parameters." }, { status: 400 });
  }

  const room = await getRoom(normalizeRoomCode(code));
  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });
  if (!room.players.includes(requesterId)) {
    return NextResponse.json({ error: "You are not part of this match." }, { status: 403 });
  }

  const roundState = room.rounds[round - 1];
  if (!roundState) return NextResponse.json({ error: "Round not found." }, { status: 404 });
  if (requesterId !== playerId && roundState.status !== "done") {
    return NextResponse.json({ error: "That artwork hasn't been revealed yet." }, { status: 403 });
  }

  const image = await getImage(room.code, round, playerId);
  if (!image) return NextResponse.json({ error: "Image not ready yet." }, { status: 404 });

  return NextResponse.json({ image });
}
