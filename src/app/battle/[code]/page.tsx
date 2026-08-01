"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import BattleHeader from "@/components/battle/BattleHeader";
import BattlePickPanel from "@/components/battle/BattlePickPanel";
import MatchResult from "@/components/battle/MatchResult";
import OpponentStatus from "@/components/battle/OpponentStatus";
import RoundResult from "@/components/battle/RoundResult";
import VotingPanel from "@/components/battle/VotingPanel";
import WaitingRoom from "@/components/battle/WaitingRoom";
import ErrorScreen from "@/components/ErrorScreen";
import LoadingScreen from "@/components/LoadingScreen";
import {
  advanceRound,
  castVote,
  fetchBattleImage,
  fetchRoomState,
  fetchVoteImage,
  joinRoom,
  lockPicks,
  readyForNext,
  rerollCard,
} from "@/lib/battle/api";
import { getStoredPlayerId, storePlayerId } from "@/lib/battle/session";
import type { BattleRoom, RoundStatus } from "@/lib/battle/types";
import type { CardKey } from "@/lib/cardFaces";

const POLL_MS = 1500;
const POLL_FAILURE_THRESHOLD = 4;
const STUCK_ROUND_MS = 45_000;

const GENERATING_MESSAGES: Partial<Record<RoundStatus, string>> = {
  prompting: "Studying everyone's traits and drafting the art direction...",
  imaging: "Painting everyone's illustrations... this can take a moment.",
  judging: "The judge is comparing every artwork...",
};

/** Ordered: every non-self player, in room order. Bot rooms number bots; friend rooms number
 *  opponents - but a single opponent/bot keeps the plain "Bot"/"Opponent" label unnumbered. */
function getOtherPlayers(players: string[], myId: string, vsBot: boolean | undefined) {
  const others = players.filter((pid) => pid !== myId);
  const baseLabel = vsBot ? "Bot" : "Opponent";
  if (others.length <= 1) return others.map((id) => ({ id, label: baseLabel }));
  return others.map((id, i) => ({ id, label: `${baseLabel} ${i + 1}` }));
}

export default function BattleRoomPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code as string).toUpperCase();

  const [storageChecked, setStorageChecked] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [pollFailureCount, setPollFailureCount] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);

  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [images, setImages] = useState<Record<string, string>>({});
  const [voteImages, setVoteImages] = useState<Record<string, string>>({});
  const [isStuck, setIsStuck] = useState(false);
  const advancingRef = useRef(false);

  useEffect(() => {
    // Deferred so reading localStorage (unavailable during SSR) happens in a callback, not the effect body itself.
    const timeout = window.setTimeout(() => {
      setPlayerId(getStoredPlayerId(code));
      setStorageChecked(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [code]);

  const refresh = useCallback(async () => {
    if (!playerId) return;
    try {
      const { room } = await fetchRoomState(code, playerId);
      setRoom(room);
      setFatalError(null);
      setPollFailureCount(0);
    } catch (err) {
      setFatalError(err instanceof Error ? err.message : "Lost connection to the match.");
      setPollFailureCount((n) => n + 1);
    }
  }, [code, playerId]);

  useEffect(() => {
    if (!playerId) return;
    const interval = window.setInterval(refresh, POLL_MS);
    const kickoff = window.setTimeout(refresh, 0);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(kickoff);
    };
  }, [playerId, refresh]);

  // Nudge the server-side generation/judging pipeline forward whenever there's pending work.
  useEffect(() => {
    if (!playerId || !room) return;
    const round = room.rounds[room.rounds.length - 1];
    if (!round || !(round.status in GENERATING_MESSAGES)) return;
    if (advancingRef.current) return;

    advancingRef.current = true;
    advanceRound(code, playerId)
      .then(({ room }) => {
        setRoom(room);
        setPollFailureCount(0);
      })
      .catch(() => {})
      .finally(() => {
        advancingRef.current = false;
      });
  }, [code, playerId, room]);

  // Once a round is done, fetch both players' images so the result screen can show them.
  useEffect(() => {
    if (!playerId || !room) return;
    const roundNumber = room.rounds.length;
    const round = room.rounds[roundNumber - 1];
    if (!round || round.status !== "done") return;

    for (const pid of room.players) {
      const key = `${roundNumber}:${pid}`;
      if (images[key]) continue;
      fetchBattleImage(code, roundNumber, pid, playerId)
        .then(({ image }) => setImages((prev) => ({ ...prev, [key]: image })))
        .catch(() => {});
    }
  }, [code, playerId, room, images]);

  // While voting, fetch this player's own anonymous ballot images (by slot, never by playerId).
  useEffect(() => {
    if (!playerId || !room) return;
    const roundNumber = room.rounds.length;
    const round = room.rounds[roundNumber - 1];
    if (!round || round.status !== "voting" || !round.voteStatus) return;

    for (let slot = 0; slot < round.voteStatus.slotCount; slot++) {
      const key = `${roundNumber}:${slot}`;
      if (voteImages[key]) continue;
      fetchVoteImage(code, roundNumber, playerId, slot)
        .then(({ image }) => setVoteImages((prev) => ({ ...prev, [key]: image })))
        .catch(() => {});
    }
  }, [code, playerId, room, voteImages]);

  const roomRounds = room?.rounds ?? [];
  const currentRoundStatus = roomRounds.length > 0 ? roomRounds[roomRounds.length - 1].status : null;
  const isGenerating = currentRoundStatus !== null && currentRoundStatus in GENERATING_MESSAGES;

  // Flags a genuinely stuck round (still generating after STUCK_ROUND_MS) so the UI can offer a
  // manual retry instead of an indefinite spinner. The timer resets whenever we (re)enter a
  // generating phase and is cleared the moment it ends, so only a true stall trips it.
  useEffect(() => {
    const resetTimeout = window.setTimeout(() => setIsStuck(false), 0);
    if (!isGenerating) {
      return () => window.clearTimeout(resetTimeout);
    }
    const stuckTimer = window.setTimeout(() => setIsStuck(true), STUCK_ROUND_MS);
    return () => {
      window.clearTimeout(resetTimeout);
      window.clearTimeout(stuckTimer);
    };
  }, [isGenerating, room?.round]);

  async function handleJoinHere() {
    setJoining(true);
    setJoinError(null);
    try {
      const { playerId: newId } = await joinRoom(code);
      storePlayerId(code, newId);
      setPlayerId(newId);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join room.");
    } finally {
      setJoining(false);
    }
  }

  async function handleReroll(key: CardKey) {
    if (!playerId) return;
    setActionBusy(true);
    try {
      const { room } = await rerollCard(code, playerId, key);
      setRoom(room);
    } catch {
      // best-effort - the next poll resyncs
    } finally {
      setActionBusy(false);
    }
  }

  async function handleLock() {
    if (!playerId) return;
    setActionBusy(true);
    try {
      const { room } = await lockPicks(code, playerId);
      setRoom(room);
    } catch {
      // ignore - next poll resyncs
    } finally {
      setActionBusy(false);
    }
  }

  async function handleVote(slot: number) {
    if (!playerId) return;
    setActionBusy(true);
    try {
      const { room } = await castVote(code, playerId, slot);
      setRoom(room);
    } catch {
      // ignore - next poll resyncs
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReady() {
    if (!playerId) return;
    setActionBusy(true);
    try {
      const { room } = await readyForNext(code, playerId);
      setRoom(room);
    } catch {
      // ignore - next poll resyncs
    } finally {
      setActionBusy(false);
    }
  }

  async function handleForceAdvance() {
    if (!playerId) return;
    setActionBusy(true);
    try {
      const { room } = await advanceRound(code, playerId);
      setRoom(room);
      setPollFailureCount(0);
      setFatalError(null);
    } catch (err) {
      setFatalError(err instanceof Error ? err.message : "Lost connection to the match.");
      setPollFailureCount((n) => n + 1);
    } finally {
      setActionBusy(false);
    }
  }

  if (!storageChecked) {
    return <LoadingScreen message="Loading match..." />;
  }

  if (!playerId) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
        <div className="glass w-full max-w-sm rounded-[2rem] p-6 text-center shadow-2xl shadow-black/40">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-300/90">1v1 Battle</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">You&apos;re Invited!</h1>
          <p className="mt-2 text-sm text-slate-400">
            Join room <span className="font-bold text-amber-300">{code}</span> for a card showdown.
          </p>

          {joinError && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {joinError}
            </p>
          )}

          <button
            type="button"
            onClick={handleJoinHere}
            disabled={joining}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {joining ? "Joining..." : "Join Room"}
          </button>
          <Link href="/battle" className="mt-4 block text-center text-sm font-semibold text-slate-400 active:text-white">
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  if (fatalError && (pollFailureCount >= POLL_FAILURE_THRESHOLD || !room)) {
    return (
      <ErrorScreen
        message={room ? `${fatalError} (still trying to reconnect...)` : fatalError}
        onRetry={refresh}
        onStartOver={() => window.location.assign("/battle")}
      />
    );
  }

  if (!room) {
    return <LoadingScreen message="Loading match..." />;
  }

  if (room.status === "waiting") {
    return <WaitingRoom code={code} playersJoined={room.players.length} maxPlayers={room.maxPlayers} />;
  }

  const otherPlayers = getOtherPlayers(room.players, playerId, room.vsBot);

  if (room.status === "finished") {
    return (
      <MatchResult
        players={[
          { id: playerId, label: "You", score: room.scores[playerId] ?? 0, isMe: true },
          ...otherPlayers.map((p) => ({ id: p.id, label: p.label, score: room.scores[p.id] ?? 0, isMe: false })),
        ]}
      />
    );
  }

  const round = room.rounds[room.rounds.length - 1];
  const myScore = room.scores[playerId] ?? 0;

  return (
    <div className="flex min-h-dvh flex-col px-5 py-8">
      <div className="mx-auto w-full max-w-sm flex-1">
        <BattleHeader
          round={room.round}
          myScore={myScore}
          others={otherPlayers.map((p) => ({ id: p.id, label: p.label, score: room.scores[p.id] ?? 0 }))}
        />

        {round.status === "picking" && (
          <>
            <BattlePickPanel
              key={room.round}
              pick={round.players[playerId]}
              rerollsLeft={room.rerolls[playerId] ?? 0}
              unlimitedRerolls={room.unlimitedRerolls}
              locked={round.players[playerId]?.locked ?? false}
              busy={actionBusy}
              onReroll={handleReroll}
              onLock={handleLock}
            />
            <OpponentStatus
              roundStatus={round.status}
              players={otherPlayers.map((p) => ({
                id: p.id,
                label: p.label,
                locked: round.players[p.id]?.locked ?? false,
              }))}
            />
          </>
        )}

        {round.status === "voting" && round.voteStatus && (
          <VotingPanel
            key={room.round}
            images={Array.from(
              { length: round.voteStatus.slotCount },
              (_, slot) => voteImages[`${room.round}:${slot}`] ?? null
            )}
            myVote={round.voteStatus.myVote}
            votedCount={round.voteStatus.votedCount}
            totalVoters={round.voteStatus.totalVoters}
            busy={actionBusy}
            onVote={handleVote}
          />
        )}

        {isGenerating && (
          <div className="glass flex flex-col items-center gap-5 rounded-[2rem] px-8 py-12 text-center">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                key={round.status}
                className="progress-fill h-full w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
              />
            </div>
            <p className="text-sm font-medium text-slate-200">{GENERATING_MESSAGES[round.status]}</p>

            {isStuck && (
              <div className="mt-2 flex w-full flex-col items-center gap-3 border-t border-white/10 pt-5">
                <p className="text-xs text-amber-300">This is taking longer than expected.</p>
                <button
                  type="button"
                  onClick={handleForceAdvance}
                  disabled={actionBusy}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 text-sm font-bold text-slate-900 transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  Try Again
                </button>
                <Link href="/battle" className="text-xs font-semibold text-slate-400 active:text-white">
                  Leave Match
                </Link>
              </div>
            )}
          </div>
        )}

        {round.status === "done" && (
          <RoundResult
            key={room.round}
            round={round}
            // Fixed room.players order rather than "me first" - so the spotlight sequence and
            // summary grid land in the same order for every viewer, not just your own view of it.
            players={room.players.map((pid) => {
              const isMe = pid === playerId;
              return {
                id: pid,
                label: isMe ? "You" : (otherPlayers.find((p) => p.id === pid)?.label ?? "Opponent"),
                image: images[`${room.round}:${pid}`] ?? null,
                pick: round.players[pid],
                ratings: round.ratings?.[pid],
                isMe,
              };
            })}
            isLastRound={room.round >= 5}
            myReady={round.players[playerId]?.readyForNext ?? false}
            allOthersReady={otherPlayers.every((p) => round.players[p.id]?.readyForNext ?? false)}
            readyBusy={actionBusy}
            onReady={handleReady}
          />
        )}
      </div>
    </div>
  );
}
