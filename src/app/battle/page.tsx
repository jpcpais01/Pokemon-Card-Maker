"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GenSelector from "@/components/GenSelector";
import JudgeModePicker from "@/components/battle/JudgeModePicker";
import PlayerCountPicker from "@/components/battle/PlayerCountPicker";
import { createRoom, joinRoom } from "@/lib/battle/api";
import { storePlayerId } from "@/lib/battle/session";
import { GENERATIONS } from "@/lib/generations";
import { MIN_VOTE_PLAYERS, type JudgeMode } from "@/lib/battle/types";

type Mode = "menu" | "create" | "join";

export default function BattleLobby() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("menu");

  const [gens, setGens] = useState<number[]>(GENERATIONS.map((g) => g.id));
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [judgeMode, setJudgeMode] = useState<JudgeMode>("ai");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function handleCreate() {
    setCreateError(null);
    setCreating(true);
    try {
      const effectiveJudgeMode = maxPlayers >= MIN_VOTE_PLAYERS ? judgeMode : "ai";
      const { code, playerId } = await createRoom(gens, false, maxPlayers, effectiveJudgeMode);
      storePlayerId(code, playerId);
      router.push(`/battle/${code}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create room.");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setJoining(true);
    try {
      const { code: roomCode, playerId } = await joinRoom(trimmed);
      storePlayerId(roomCode, playerId);
      router.push(`/battle/${roomCode}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Failed to join room.");
    } finally {
      setJoining(false);
    }
  }

  if (mode === "create") {
    return (
      <GenSelector
        selected={gens}
        onChange={setGens}
        onStart={handleCreate}
        loading={creating}
        error={createError}
        eyebrow="Battle"
        title="Create a Room"
        subtitle="Pick which generations everyone can pull from and how many players, then share the room code."
        buttonLabel="Create Room"
        loadingLabel="Creating room..."
        extraTop={
          <>
            <PlayerCountPicker value={maxPlayers} onChange={setMaxPlayers} />
            {maxPlayers >= MIN_VOTE_PLAYERS && <JudgeModePicker value={judgeMode} onChange={setJudgeMode} />}
          </>
        }
        footer={
          <button
            type="button"
            onClick={() => setMode("menu")}
            className="mt-4 block w-full text-center text-sm font-semibold text-slate-400 active:text-white"
          >
            ← Back
          </button>
        }
      />
    );
  }

  if (mode === "join") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
        <form onSubmit={handleJoin} className="glass w-full max-w-sm rounded-[2rem] p-6 shadow-2xl shadow-black/40">
          <div className="mb-7 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-300/90">Battle</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Join a Room</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Enter the 6-character code your friend shared with you.
            </p>
          </div>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="ABC123"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-4 text-center text-2xl font-black tracking-[0.3em] text-white placeholder:text-slate-600 focus:border-amber-300/60 focus:outline-none"
          />

          {joinError && (
            <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">
              {joinError}
            </p>
          )}

          <button
            type="submit"
            disabled={joining || code.trim().length < 4}
            className="mt-7 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {joining ? "Joining..." : "Join Room"}
          </button>

          <button
            type="button"
            onClick={() => setMode("menu")}
            className="mt-4 block w-full text-center text-sm font-semibold text-slate-400 active:text-white"
          >
            ← Back
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="glass w-full max-w-sm rounded-[2rem] p-6 shadow-2xl shadow-black/40">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-300/90">Battle</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Card Showdown</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Open packs against 1-3 friends. Five rounds, an AI judge picks the better card each round, most points
            wins.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setMode("create")}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98]"
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className="glass w-full rounded-2xl py-4 text-base font-bold text-white transition-colors active:bg-white/10"
          >
            Join Room
          </button>
        </div>

        <Link href="/" className="mt-6 block text-center text-sm font-semibold text-slate-400 active:text-white">
          ← Solo mode
        </Link>
      </div>
    </div>
  );
}
