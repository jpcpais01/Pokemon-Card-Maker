"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GenSelector from "@/components/GenSelector";
import Screen from "@/components/ui/Screen";
import Icon from "@/components/ui/Icon";
import JudgeModePicker from "@/components/battle/JudgeModePicker";
import PackModePicker from "@/components/battle/PackModePicker";
import NicknameField, { isNicknameUsable } from "@/components/battle/NicknameField";
import PlayerCountPicker from "@/components/battle/PlayerCountPicker";
import { createRoom, joinRoom } from "@/lib/battle/api";
import { ROOM_CODE_LENGTH } from "@/lib/battle/roomCode";
import { storePlayerId } from "@/lib/battle/session";
import { getEvent, parseEventTheme } from "@/lib/events";
import { GENERATIONS } from "@/lib/generations";
import { BATTLE_ROUNDS, MIN_VOTE_PLAYERS, type JudgeMode } from "@/lib/battle/types";
import type { PackMode } from "@/lib/types";

type Mode = "menu" | "create" | "join";

const PACK_MODES: PackMode[] = ["classic", "sir", "tagteam", "tagteamsir", "tripletagteamsir"];

function parsePackMode(value: string | null): PackMode {
  return PACK_MODES.includes(value as PackMode) ? (value as PackMode) : "classic";
}

function BattleLobby() {
  const router = useRouter();
  const params = useSearchParams();
  // An event hub hands off here with ?create=1 so the room-setup step opens directly.
  const theme = parseEventTheme(params.get("theme"));
  const event = getEvent(theme);

  const [mode, setMode] = useState<Mode>(params.get("create") === "1" ? "create" : "menu");

  const [gens, setGens] = useState<number[]>(event ? event.defaultGens : GENERATIONS.map((g) => g.id));
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [judgeMode, setJudgeMode] = useState<JudgeMode>("ai");
  const [packMode, setPackMode] = useState<PackMode>(parsePackMode(params.get("pack")));
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [nickname, setNickname] = useState("");

  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function handleCreate() {
    setCreateError(null);
    setCreating(true);
    try {
      const effectiveJudgeMode = maxPlayers >= MIN_VOTE_PLAYERS ? judgeMode : "ai";
      const { code, playerId } = await createRoom(
        gens,
        false,
        maxPlayers,
        effectiveJudgeMode,
        false,
        packMode,
        theme,
        nickname
      );
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
      const { code: roomCode, playerId } = await joinRoom(trimmed, nickname);
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
        eyebrow={event ? event.label : "Create Room"}
        title="Set the Rules"
        subtitle="Pick the pool everyone pulls from, then how the match plays out."
        buttonLabel="Create Room"
        loadingLabel="Creating room..."
        startDisabled={!isNicknameUsable(nickname)}
        back={event ? `/event/${event.slug}` : () => setMode("menu")}
        eventBanner={event ? { label: event.label, gradient: event.gradient, image: event.image } : undefined}
        extraTop={
          <>
            <NicknameField value={nickname} onChange={setNickname} />
            <PlayerCountPicker value={maxPlayers} onChange={setMaxPlayers} />
            <PackModePicker value={packMode} onChange={setPackMode} />
            {maxPlayers >= MIN_VOTE_PLAYERS && <JudgeModePicker value={judgeMode} onChange={setJudgeMode} />}
          </>
        }
      />
    );
  }

  if (mode === "join") {
    return (
      <Screen immersive back={() => setMode("menu")} title="Join Room">
        <form onSubmit={handleJoin} className="screen-pad flex flex-1 flex-col">
          <div className="enter-up mb-7 mt-1">
            <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-white">
              Enter the Code
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-400">
              Type the {ROOM_CODE_LENGTH}-letter code your friend shared with you.
            </p>
          </div>

          <input
            value={code}
            // Codes are letters only, so anything else can never match a room - dropping it as
            // it's typed beats letting someone fill the field with digits and hit a 404.
            onChange={(e) =>
              setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, ROOM_CODE_LENGTH))
            }
            placeholder={"–".repeat(ROOM_CODE_LENGTH)}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            aria-label="Room code"
            className="enter-up card w-full py-6 text-center font-display text-[2.5rem] font-black tracking-[0.35em] text-white placeholder:text-slate-700 focus:border-amber-300/50 focus:outline-none"
            style={{ "--d": "60ms" } as React.CSSProperties}
          />

          <div className="enter-up mt-5" style={{ "--d": "110ms" } as React.CSSProperties}>
            <NicknameField value={nickname} onChange={setNickname} />
          </div>

          {joinError && (
            <p className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-[13px] text-red-300">
              {joinError}
            </p>
          )}

          <button
            type="submit"
            disabled={joining || code.trim().length < ROOM_CODE_LENGTH || !isNicknameUsable(nickname)}
            className="btn-primary mt-6 w-full disabled:pointer-events-none disabled:opacity-40"
          >
            {joining ? "Joining..." : "Join Room"}
          </button>
        </form>
      </Screen>
    );
  }

  return (
    <Screen bare>
      <div className="screen-pad flex flex-1 flex-col pt-safe">
        <header className="enter-up py-3">
          <h1 className="font-display text-[28px] font-extrabold leading-none tracking-tight text-white">
            Card Showdown
          </h1>
          <p className="mt-1.5 text-[13px] text-slate-400">
            {BATTLE_ROUNDS} rounds. Best card each round takes the point.
          </p>
        </header>

        {/* Versus hero - makes the mode feel like an event, not a menu item. */}
        <div
          className="card-raised enter-up relative mt-3 overflow-hidden p-6"
          style={{ "--d": "60ms" } as React.CSSProperties}
        >
          <div
            aria-hidden
            className="glow-pulse pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-violet-500/25 blur-3xl"
          />
          <div
            aria-hidden
            className="glow-pulse pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl"
            style={{ animationDelay: "-1.8s" }}
          />
          <div className="relative flex items-center justify-center gap-5">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-3xl">
              🎴
            </span>
            <span className="font-display text-2xl font-black text-slate-500">VS</span>
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-400/15 text-3xl">
              🎴
            </span>
          </div>
          <p className="relative mt-4 text-center text-[13px] leading-relaxed text-slate-400">
            Everyone opens a pack from the same pool. An AI judge — or the players — pick the winner.
          </p>
        </div>

        <p className="section-label enter-up mb-2.5 mt-7" style={{ "--d": "120ms" } as React.CSSProperties}>
          Start a match
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setMode("create")}
            className="card enter-up group flex items-center gap-3.5 p-4 text-left transition-transform duration-150 active:scale-[0.98]"
            style={{ "--d": "160ms" } as React.CSSProperties}
          >
            <span className="brand-gradient flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/25">
              <Icon name="users" size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-white">Battle a Friend</p>
              <p className="mt-0.5 text-[12.5px] text-slate-400">Create a room and share the code</p>
            </div>
            <Icon name="chevron-right" size={18} className="flex-shrink-0 text-slate-600" />
          </button>

          <button
            type="button"
            onClick={() => setMode("join")}
            className="card enter-up group flex items-center gap-3.5 p-4 text-left transition-transform duration-150 active:scale-[0.98]"
            style={{ "--d": "215ms" } as React.CSSProperties}
          >
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300">
              <Icon name="plus" size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-white">Join a Room</p>
              <p className="mt-0.5 text-[12.5px] text-slate-400">Enter a friend&apos;s code</p>
            </div>
            <Icon name="chevron-right" size={18} className="flex-shrink-0 text-slate-600" />
          </button>

          <Link
            href="/bot"
            className="card enter-up group flex items-center gap-3.5 p-4 transition-transform duration-150 active:scale-[0.98]"
            style={{ "--d": "270ms" } as React.CSSProperties}
          >
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-500/12 text-cyan-300">
              <Icon name="bot" size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-white">Battle a Bot</p>
              <p className="mt-0.5 text-[12.5px] text-slate-400">1–9 CPU opponents, play instantly</p>
            </div>
            <Icon name="chevron-right" size={18} className="flex-shrink-0 text-slate-600" />
          </Link>
        </div>
      </div>
    </Screen>
  );
}

export default function BattleLobbyPage() {
  return (
    <Suspense fallback={null}>
      <BattleLobby />
    </Suspense>
  );
}
