import { NextResponse } from "next/server";
import { sanitizeRoomForPlayer } from "@/lib/battle/engine";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getImage, getRoom, lockKey, saveImage, saveRoom } from "@/lib/battle/rooms";
import { acquireLock, releaseLock } from "@/lib/battle/store";
import type { BattleRound } from "@/lib/battle/types";
import { generateImage, generateText, judgeBattle } from "@/lib/openrouter";
import { JUDGE_SYSTEM_PROMPT, SYSTEM_PROMPT, buildStyleSuffix, buildUserPrompt } from "@/lib/promptBuilder";

export const maxDuration = 60;

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
  const initialRoom = await getRoom(code);
  if (!initialRoom) return NextResponse.json({ error: "Room not found." }, { status: 404 });
  if (!initialRoom.players.includes(playerId)) {
    return NextResponse.json({ error: "You are not part of this match." }, { status: 403 });
  }

  const initialRound = initialRoom.rounds[initialRoom.rounds.length - 1];
  if (!initialRound || initialRound.status === "picking" || initialRound.status === "done") {
    return NextResponse.json({ room: sanitizeRoomForPlayer(initialRoom, playerId) });
  }

  // Must comfortably outlast this route's own maxDuration (60s) - the previous default (25s)
  // could expire while a slow image generation was still in flight, letting a concurrent poll
  // from the other player acquire the "free" lock and start processing the same round a second
  // time in parallel (duplicate OpenRouter calls racing to overwrite each other's saved state).
  const gotLock = await acquireLock(lockKey(code), 55);
  if (!gotLock) {
    return NextResponse.json({ room: sanitizeRoomForPlayer(initialRoom, playerId) });
  }

  try {
    const room = await getRoom(code);
    if (!room) return NextResponse.json({ error: "Room not found." }, { status: 404 });

    const currentRound = room.rounds[room.rounds.length - 1];
    if (!currentRound || currentRound.status === "picking" || currentRound.status === "done") {
      return NextResponse.json({ room: sanitizeRoomForPlayer(room, playerId) });
    }

    if (currentRound.status === "prompting") {
      // Persist after EACH player's draft, not just once at the end - if this request gets cut
      // off mid-flight (e.g. a platform execution-time limit), whichever player already finished
      // stays done instead of being silently lost and redone on the next attempt.
      await Promise.all(
        Object.values(currentRound.players).map(async (state) => {
          if (state.promptStatus !== "pending") return;
          try {
            const userPrompt = buildUserPrompt({
              artType: state.artType,
              specialForm: state.specialForm,
              pokemons: state.pokemons.map((p) => ({ name: p.displayName })),
            });
            const drafted = await generateText(SYSTEM_PROMPT, userPrompt);
            state.prompt = `${drafted}${buildStyleSuffix(state.pokemons.map((p) => p.displayName))}`;
            state.promptStatus = "ready";
          } catch {
            state.promptStatus = "error";
          }
          await saveRoom(room);
        })
      );
      if (Object.values(currentRound.players).every((p) => p.promptStatus !== "pending")) {
        currentRound.status = "imaging";
      }
    } else if (currentRound.status === "imaging") {
      await Promise.all(
        Object.entries(currentRound.players).map(async ([pid, state]) => {
          if (state.promptStatus === "error") {
            state.imageStatus = "error";
            await saveRoom(room);
            return;
          }
          if (state.imageStatus !== "pending" || !state.prompt) return;
          try {
            const image = await generateImage(state.prompt);
            await saveImage(room.code, room.round, pid, image);
            state.imageStatus = "ready";
          } catch {
            state.imageStatus = "error";
          }
          await saveRoom(room);
        })
      );
      if (Object.values(currentRound.players).every((p) => p.imageStatus !== "pending")) {
        currentRound.status = "judging";
      }
    } else if (currentRound.status === "judging") {
      const [pidA, pidB] = room.players;
      const stateA = currentRound.players[pidA];
      const stateB = currentRound.players[pidB];

      let winnerId: string;
      let verdict: string;
      let ratings: BattleRound["ratings"];

      if (stateA.imageStatus === "ready" && stateB.imageStatus === "ready") {
        const [imageA, imageB] = await Promise.all([
          getImage(room.code, room.round, pidA),
          getImage(room.code, room.round, pidB),
        ]);
        const namesA = stateA.pokemons.map((p) => p.displayName).join(" & ");
        const namesB = stateB.pokemons.map((p) => p.displayName).join(" & ");
        try {
          if (!imageA || !imageB) throw new Error("Missing stored image.");
          const judged = await judgeBattle(JUDGE_SYSTEM_PROMPT, imageA, namesA, imageB, namesB);
          winnerId = judged.winner === "A" ? pidA : pidB;
          verdict = judged.reason;
          ratings = { [pidA]: judged.card1Ratings, [pidB]: judged.card2Ratings };
        } catch {
          winnerId = Math.random() < 0.5 ? pidA : pidB;
          verdict = "The judge was speechless - too close to call, so the coin decided!";
        }
      } else {
        const aOk = stateA.imageStatus === "ready";
        const bOk = stateB.imageStatus === "ready";
        if (aOk && !bOk) {
          winnerId = pidA;
          verdict = "The opponent's artwork couldn't be generated this round - default win.";
        } else if (bOk && !aOk) {
          winnerId = pidB;
          verdict = "The opponent's artwork couldn't be generated this round - default win.";
        } else {
          winnerId = Math.random() < 0.5 ? pidA : pidB;
          verdict = "Neither artwork could be generated this round - the coin decided!";
        }
      }

      currentRound.winnerId = winnerId;
      currentRound.verdict = verdict;
      currentRound.ratings = ratings;
      room.scores[winnerId] = (room.scores[winnerId] ?? 0) + 1;
      currentRound.status = "done";
    }

    room.rounds[room.rounds.length - 1] = currentRound;
    await saveRoom(room);
    return NextResponse.json({ room: sanitizeRoomForPlayer(room, playerId) });
  } finally {
    await releaseLock(lockKey(code));
  }
}
