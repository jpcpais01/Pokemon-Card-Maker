import { NextResponse } from "next/server";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getRoom } from "@/lib/battle/rooms";

/**
 * What a room would cost to join, without joining it.
 *
 * A match is paid for by every player, and the price comes from settings only the host chose -
 * so until this existed, the only way to learn it was to join, which meant a player who couldn't
 * afford the room had already taken a seat in it by the time they were told. Quoting first keeps
 * the seat free.
 *
 * Needs no player id because it is asked before there is one. It reveals nothing a code holder
 * couldn't get by simply joining.
 */
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code." }, { status: 400 });

  const room = await getRoom(normalizeRoomCode(code));
  if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  return NextResponse.json({ packMode: room.packMode ?? "classic", gens: room.gens });
}
