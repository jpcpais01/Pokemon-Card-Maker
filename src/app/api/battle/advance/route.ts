import { NextResponse } from "next/server";
import { buildVoteOrders, sanitizeRoomForPlayer } from "@/lib/battle/engine";
import { splitIntoJudgeBatches } from "@/lib/battle/judgePlan";
import { normalizeRoomCode } from "@/lib/battle/roomCode";
import { getImage, getRoom, lockKey, saveImage, saveRoom } from "@/lib/battle/rooms";
import { acquireLock, releaseLock } from "@/lib/battle/store";
import { ratingsTotal } from "@/lib/battle/tier";
import { isBotPlayerId, type BattleRound } from "@/lib/battle/types";
import type { EventTheme } from "@/lib/events";
import { isBaddiesOnlySelection } from "@/lib/generations";
import { generateImage, generateText, judgeMultiBattle, type JudgeCardInput } from "@/lib/openrouter";
import { SYSTEM_PROMPT, buildJudgeSystemPrompt, buildStyleSuffix, buildUserPrompt } from "@/lib/promptBuilder";

/** Cards within one judging group. Groups are at most 3, so this never needs a 4th. */
const LETTERS = ["A", "B", "C"];

export const maxDuration = 60;

/**
 * Judges one group, retrying once with the event context stripped out if the themed attempt
 * fails.
 *
 * An event's framing can be enough on its own for the vision model to refuse the request and
 * return nothing - and because the round's ratings are what drive the score bars, a refusal
 * used to cost the whole reveal: no bars, no tiers, just a coin flip and "the judge was
 * speechless". The artwork is perfectly judgeable either way, so rather than lose the round to
 * the theme, fall back to the plain rubric. Scores come from the images regardless; all the
 * theme ever did was tell the judge what the cards were reaching for.
 */
async function judgeGroup(letters: string[], cards: JudgeCardInput[], theme: EventTheme | undefined) {
  if (theme) {
    try {
      return await judgeMultiBattle(buildJudgeSystemPrompt(letters, theme), cards);
    } catch (err) {
      console.error(`battle/advance: judging failed for the "${theme}" event, retrying unthemed`, err);
    }
  }
  try {
    return await judgeMultiBattle(buildJudgeSystemPrompt(letters), cards);
  } catch (err) {
    // Splitting a round across several calls multiplies the chance that at least one of them
    // fails, and one failed group costs every player in the round their ratings - not just the
    // two in it. One more attempt is cheap next to losing the whole reveal.
    console.error("battle/advance: judging a group failed, retrying once", err);
    return judgeMultiBattle(buildJudgeSystemPrompt(letters), cards);
  }
}

interface JudgeEntry {
  playerId: string;
  image: string;
  names: string;
}

/**
 * Judges the round in small groups rather than showing one judge the whole table.
 *
 * The groups run in parallel and each one only ever sees two or three cards, which is the
 * comparison a judge can actually make carefully - a single call ranking ten images at once
 * asks for far more discrimination than it can give, and costs a request that grows with the
 * table. What holds it together is that the rubric is absolute: every card is scored 1-10 on
 * its own merits, not placed relative to whoever it happened to be shown beside, so totals
 * from different groups are still comparable and the round winner is simply the highest one.
 *
 * Groups are drawn in a fresh random order every round. With fixed ordering the same two
 * players would be paired for all five rounds of a match, and any relative anchoring the
 * judge does despite the rubric would land on the same person every time.
 */
async function judgeRoundInGroups(entries: JudgeEntry[], theme: EventTheme | undefined) {
  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const groups = splitIntoJudgeBatches(shuffled);
  const judged = await Promise.all(
    groups.map(async (group) => {
      const letters = group.map((_, i) => LETTERS[i]);
      const cards: JudgeCardInput[] = group.map((entry, i) => ({
        letter: letters[i],
        image: entry.image,
        names: entry.names,
      }));
      const result = await judgeGroup(letters, cards, theme);
      return group.map((entry, i) => ({
        playerId: entry.playerId,
        ratings: result.ratings[letters[i]],
        reason: result.reason,
      }));
    })
  );

  const scored = judged.flat();
  const best = scored.reduce((top, card) =>
    ratingsTotal(card.ratings) > ratingsTotal(top.ratings) ? card : top
  );
  return {
    ratings: Object.fromEntries(scored.map((c) => [c.playerId, c.ratings])),
    // The winner's own group wrote the line that actually describes how they won.
    reason: best.reason,
    winnerId: best.playerId,
  };
}

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
  if (
    !initialRound ||
    initialRound.status === "picking" ||
    initialRound.status === "voting" ||
    initialRound.status === "done"
  ) {
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
    // An explicit event theme wins; otherwise a Baddies-only pool still implies that look.
    const theme: EventTheme | undefined =
      room.theme ?? (isBaddiesOnlySelection(room.gens) ? "baddies" : undefined);

    const currentRound = room.rounds[room.rounds.length - 1];
    if (
      !currentRound ||
      currentRound.status === "picking" ||
      currentRound.status === "voting" ||
      currentRound.status === "done"
    ) {
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
              vibe: state.vibe,
              pokemons: state.pokemons.map((p) => ({ name: p.displayName })),
              theme,
            });
            const drafted = await generateText(SYSTEM_PROMPT, userPrompt);
            state.prompt = `${drafted}${buildStyleSuffix(state.pokemons.map((p) => p.displayName), state.specialForm.value, theme)}`;
            state.promptStatus = "ready";
          } catch (err) {
            console.error("battle/advance: prompt drafting failed", err);
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
          } catch (err) {
            // A card that fails to generate takes the round's ratings with it - judging needs
            // every image, so one failure here also costs the score bars.
            console.error("battle/advance: image generation failed", err);
            state.imageStatus = "error";
          }
          await saveRoom(room);
        })
      );
      if (Object.values(currentRound.players).every((p) => p.imageStatus !== "pending")) {
        if (room.judgeMode === "vote") {
          const pids = room.players;
          const readyPids = pids.filter((pid) => currentRound.players[pid].imageStatus === "ready");

          if (readyPids.length <= 1) {
            // Not enough valid artwork to vote on at all - resolve immediately, same as the
            // AI-judge fallback below for this exact situation.
            const winnerId = readyPids[0] ?? pids[Math.floor(Math.random() * pids.length)];
            currentRound.winnerId = winnerId;
            currentRound.verdict =
              readyPids.length === 1
                ? "Everyone else's artwork failed to generate - default win!"
                : "Nobody's artwork could be generated this round - the coin decided!";
            room.scores[winnerId] = (room.scores[winnerId] ?? 0) + 1;
            currentRound.status = "done";
          } else {
            const order = buildVoteOrders(pids, readyPids);
            const votes: Record<string, string> = {};
            // Bots have no client polling to cast a vote for themselves - they vote at random,
            // the instant the ballot opens, same spirit as their instant pick-lock.
            for (const pid of pids) {
              if (isBotPlayerId(pid) && order[pid]?.length) {
                votes[pid] = order[pid][Math.floor(Math.random() * order[pid].length)];
              }
            }
            currentRound.vote = { order, votes };
            currentRound.status = "voting";
          }
        } else {
          currentRound.status = "judging";
        }
      }
    } else if (currentRound.status === "judging") {
      const pids = room.players;
      const states = pids.map((pid) => currentRound.players[pid]);
      const readyPids = pids.filter((_, i) => states[i].imageStatus === "ready");

      let winnerId: string;
      let verdict: string;
      let ratings: BattleRound["ratings"];

      if (readyPids.length === pids.length) {
        const images = await Promise.all(pids.map((pid) => getImage(room.code, room.round, pid)));
        try {
          if (images.some((img) => !img)) throw new Error("Missing stored image.");
          const judged = await judgeRoundInGroups(
            pids.map((pid, i) => ({
              playerId: pid,
              image: images[i]!,
              names: states[i].pokemons.map((p) => p.displayName).join(" & "),
            })),
            theme
          );
          winnerId = judged.winnerId;
          verdict = judged.reason;
          ratings = judged.ratings;
        } catch (err) {
          // Logged, not swallowed: this branch drops the round's ratings, so the client loses
          // the whole score-bar stage. Without a line in the log, "the judge isn't working"
          // has nothing behind it to diagnose.
          console.error("battle/advance: judging failed, falling back to a coin flip", err);
          winnerId = pids[Math.floor(Math.random() * pids.length)];
          verdict = "The judge was speechless - too close to call, so the coin decided!";
        }
      } else if (readyPids.length > 0) {
        winnerId = readyPids[Math.floor(Math.random() * readyPids.length)];
        verdict = "Not everyone's artwork could be generated this round - default win.";
      } else {
        winnerId = pids[Math.floor(Math.random() * pids.length)];
        verdict = "Nobody's artwork could be generated this round - the coin decided!";
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
