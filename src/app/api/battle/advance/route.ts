import { NextResponse } from "next/server";
import { awardRoundWin, buildVoteOrders, sanitizeRoomForPlayer } from "@/lib/battle/engine";
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
  try {
    return await judgeMultiBattle(buildJudgeSystemPrompt(letters, theme), cards);
  } catch (err) {
    console.error(
      theme
        ? `battle/advance: judging failed for the "${theme}" event, retrying unthemed`
        : "battle/advance: judging a group failed, retrying once",
      err
    );
    // Deliberately two attempts and no more. `judgeMultiBattle` already walks its own ladder of
    // progressively less constrained requests inside each one, and this route has a 60s ceiling
    // it shares with every other group - a deeper chain here mostly buys the chance of being
    // killed mid-flight, which costs the round far more than one group giving up does.
    return judgeMultiBattle(buildJudgeSystemPrompt(letters), cards);
  }
}

/**
 * Runs `attempt` again once if it fails.
 *
 * Prompt drafting and image generation had no retry at all, so a single transient hiccup from
 * the provider - a rate limit, a 5xx, one refusal - permanently marked that player's card as
 * failed for the round. That is expensive out of proportion to the cause: a card with no artwork
 * can't be judged, so at a full table one blip used to cost the entire round its scores. Two
 * attempts turn most of those back into a normal round.
 */
async function twice<T>(label: string, attempt: () => Promise<T>): Promise<T> {
  try {
    return await attempt();
  } catch (err) {
    console.error(`battle/advance: ${label} failed, retrying once`, err);
    return attempt();
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
  /*
   * `allSettled`, not `all`.
   *
   * A ten-player table is judged as five independent calls, and with `all` a single one of them
   * failing rejected the whole thing - so every player in the round lost their ratings because
   * two of them happened to share a group with a bad response. That turns any per-call failure
   * rate into a much larger per-round one: five groups at a 10% failure rate lose the round 41%
   * of the time. The groups have nothing to do with each other, so a failure in one is now just
   * that group's problem.
   */
  const settled = await Promise.allSettled(
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

  const scored = settled.flatMap((outcome, i) => {
    if (outcome.status === "fulfilled") return outcome.value;
    console.error(`battle/advance: judging group ${i + 1}/${groups.length} failed after retries`, outcome.reason);
    return [];
  });
  if (scored.length === 0) throw new Error("Every judging group failed.");
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
            const drafted = await twice("prompt drafting", () => generateText(SYSTEM_PROMPT, userPrompt));
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
            const image = await twice("image generation", () => generateImage(state.prompt!));
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
            awardRoundWin(room, currentRound, winnerId);
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

      // Judge whoever actually has artwork, rather than demanding the whole table.
      //
      // This used to require every single image, so one card failing to generate - out of ten,
      // with no retry behind it - threw away the judging for everyone and dropped the round to a
      // default win with no scores at all. The rubric grades each card on its own merits, so a
      // missing card costs that player their rating and nothing more.
      if (readyPids.length >= 2) {
        const readyStates = readyPids.map((pid) => currentRound.players[pid]);
        const images = await Promise.all(readyPids.map((pid) => getImage(room.code, room.round, pid)));
        try {
          const entries = readyPids
            .map((pid, i) => ({
              playerId: pid,
              image: images[i],
              names: readyStates[i].pokemons.map((p) => p.displayName).join(" & "),
            }))
            .filter((e): e is { playerId: string; image: string; names: string } => !!e.image);
          if (entries.length < 2) throw new Error("Not enough stored images to judge.");
          const judged = await judgeRoundInGroups(entries, theme);
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
      awardRoundWin(room, currentRound, winnerId);
      currentRound.status = "done";
    }

    room.rounds[room.rounds.length - 1] = currentRound;
    await saveRoom(room);
    return NextResponse.json({ room: sanitizeRoomForPlayer(room, playerId) });
  } finally {
    await releaseLock(lockKey(code));
  }
}
