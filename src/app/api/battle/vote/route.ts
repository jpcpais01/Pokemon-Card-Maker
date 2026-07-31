import { NextResponse } from "next/server";
import { sanitizeRoomForPlayer } from "@/lib/battle/engine";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getRoom, lockKey, saveRoom } from "@/lib/battle/rooms";
import { acquireLock, releaseLock } from "@/lib/battle/store";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  let body: { code?: string; playerId?: string; slot?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { playerId, slot } = body;
  if (!body.code || !playerId || !Number.isInteger(slot)) {
    return NextResponse.json({ error: "Missing code, playerId, or slot." }, { status: 400 });
  }

  const code = normalizeRoomCode(body.code);

  // Up to 4 players can cast their vote within the same poll tick - lock the room for the brief
  // moment it takes to record one, same pattern as join, so two votes can't race and clobber
  // each other via an unlocked read-modify-write.
  let gotLock = false;
  for (let attempt = 0; attempt < 5 && !gotLock; attempt++) {
    gotLock = await acquireLock(lockKey(code), 10);
    if (!gotLock) await sleep(150);
  }
  if (!gotLock) {
    return NextResponse.json({ error: "Room is busy right now - try again." }, { status: 409 });
  }

  try {
    const room = await getRoom(code);
    if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });
    if (!room.players.includes(playerId)) {
      return NextResponse.json({ error: "You are not part of this match." }, { status: 403 });
    }

    const round = room.rounds[room.rounds.length - 1];
    if (!round || round.status !== "voting" || !round.vote) {
      return NextResponse.json({ error: "This round isn't accepting votes right now." }, { status: 409 });
    }
    if (round.vote.votes[playerId]) {
      return NextResponse.json({ error: "You've already voted this round." }, { status: 409 });
    }

    const myOrder = round.vote.order[playerId] ?? [];
    const targetId = slot !== undefined ? myOrder[slot] : undefined;
    if (!targetId) {
      return NextResponse.json({ error: "Invalid vote selection." }, { status: 400 });
    }

    round.vote.votes[playerId] = targetId;

    if (Object.keys(round.vote.votes).length === room.players.length) {
      const counts: Record<string, number> = {};
      for (const pid of room.players) counts[pid] = 0;
      for (const target of Object.values(round.vote.votes)) {
        counts[target] = (counts[target] ?? 0) + 1;
      }
      const maxCount = Math.max(...Object.values(counts));
      const leaders = room.players.filter((pid) => counts[pid] === maxCount);
      const winnerId = leaders.length === 1 ? leaders[0] : leaders[Math.floor(Math.random() * leaders.length)];

      round.winnerId = winnerId;
      round.voteCounts = counts;
      round.verdict =
        leaders.length > 1
          ? "A dead tie in the vote - the coin decided!"
          : `Voted the crowd favorite with ${maxCount} of ${room.players.length} votes!`;
      room.scores[winnerId] = (room.scores[winnerId] ?? 0) + 1;
      round.status = "done";
    }

    room.rounds[room.rounds.length - 1] = round;
    await saveRoom(room);
    return NextResponse.json({ room: sanitizeRoomForPlayer(room, playerId) });
  } finally {
    await releaseLock(lockKey(code));
  }
}
