"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import NicknameField, { isNicknameUsable } from "@/components/battle/NicknameField";
import { joinRoom } from "@/lib/battle/api";
import { matchCost, spendTokens } from "@/lib/tokens";
import { ROOM_CODE_LENGTH } from "@/lib/battle/roomCode";
import { storeNickname, storePlayerId } from "@/lib/battle/session";
import { useNickname } from "@/lib/battle/useNickname";

/**
 * Joining a room, as a sheet rather than a screen.
 *
 * It's two fields and a button, reached from one place, and it used to sit behind a whole
 * section of navigation. Everything else that section offered - start a match against bots or
 * friends - is now on every mode's own hub, so this is all that was left of it.
 */
export default function JoinRoomSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useNickname();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = code.trim().length >= ROOM_CODE_LENGTH && isNicknameUsable(nickname);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setError(null);
    setJoining(true);
    try {
      const { code: roomCode, playerId, packMode, gens } = await joinRoom(code.trim().toUpperCase(), nickname);
      // Joining means opening five packs too, at whatever the host set the room to - which is
      // why the price can only be checked once the room has answered.
      const cost = matchCost(packMode, gens);
      if (!spendTokens(cost)) {
        throw new Error(`This match costs ${cost} tokens to join.`);
      }
      storePlayerId(roomCode, playerId);
      storeNickname(nickname);
      router.push(`/battle/${roomCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room.");
      setJoining(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="card-raised sheet-in w-full max-w-md rounded-b-none rounded-t-[1.75rem] p-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="section-label text-amber-300/80">Join a room</p>
            <h2 className="font-display mt-1 text-[1.5rem] font-extrabold leading-none tracking-tight text-white">
              Enter the code
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-slate-400 transition-transform active:scale-95"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <input
          value={code}
          // Codes are letters only, so anything else can never match a room.
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, ROOM_CODE_LENGTH))}
          placeholder={"–".repeat(ROOM_CODE_LENGTH)}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          aria-label="Room code"
          className="card w-full py-5 text-center font-display text-[2.25rem] font-black tracking-[0.35em] text-white placeholder:text-slate-700 focus:border-amber-300/50 focus:outline-none"
        />

        <div className="mt-4">
          <NicknameField value={nickname} onChange={setNickname} />
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-[13px] text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={joining || !ready}
          className="btn-primary mt-5 w-full disabled:pointer-events-none disabled:opacity-40"
        >
          {joining ? "Joining..." : "Join Room"}
        </button>
      </form>
    </div>
  );
}
