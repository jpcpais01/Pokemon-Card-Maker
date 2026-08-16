"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { POWERUPS, type PowerupId } from "@/lib/battle/types";

interface Props {
  /** Not yet spent this match. */
  available: PowerupId[];
  /** When a running Deep Dive expires, as epoch ms. Absent when none is running. */
  deepDiveUntil?: number;
  /** Played this round, if any - at most one. */
  active?: PowerupId;
  /** No more plays once the pick is in. */
  locked: boolean;
  busy: boolean;
  onPlay: (id: PowerupId) => void;
}

/** How long a tapped button stays in its confirm state before giving up on it. */
const CONFIRM_MS = 4000;

/**
 * Whole seconds left on a deadline, or null when there isn't one (or it has passed).
 *
 * Ticks on a one-second interval rather than an animation frame: this is a number being read,
 * not an animation, and a phone in a ten-player match has better things to do sixty times a
 * second. The deadline itself comes from the server, so this only ever renders it.
 */
function useCountdown(until?: number): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until === undefined) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [until]);

  if (until === undefined) return null;
  const left = Math.ceil((until - now) / 1000);
  return left > 0 ? left : null;
}

/**
 * The three one-shot power-ups, shown above the pick panel while picking.
 *
 * Every button is always on screen whatever its state - available, spent, or the one in play -
 * because half the decision is knowing what you are still holding. Playing one cannot be undone
 * and there are only three in a whole match, so a tap arms the button and a second tap inside a
 * few seconds commits it; nobody spends a Double Down on a misplaced thumb.
 */
export default function PowerupBar({ available, deepDiveUntil, active, locked, busy, onPlay }: Props) {
  const secondsLeft = useCountdown(deepDiveUntil);
  const [armed, setArmed] = useState<PowerupId | null>(null);
  const playedThisRound = !!active;
  // Derived rather than cleared in an effect: once a play has landed or the pick is locked, there
  // is nothing left to confirm, and that's a fact about this render, not a state change to make.
  const pending = playedThisRound || locked ? null : armed;

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(null), CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="section-label">Power-ups</p>
        <p className="text-[10px] font-semibold text-slate-500">One of each, per match</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {POWERUPS.map((p) => {
          const isActive = active === p.id;
          const isSpent = !available.includes(p.id) && !isActive;
          const isPending = pending === p.id;
          // Everything else is off the table for the round the moment one is played.
          const disabled = isSpent || isActive || playedThisRound || locked || busy;

          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => (isPending ? onPlay(p.id) : setArmed(p.id))}
              aria-label={`${p.label}: ${p.blurb}`}
              className={`card flex min-h-[5.5rem] flex-col items-center justify-center gap-1 px-1.5 py-2.5 text-center transition-transform duration-150 active:scale-[0.97] ${
                isActive
                  ? "!border-amber-300/70 !bg-amber-300/10"
                  : isPending
                    ? "!border-amber-300/60"
                    : isSpent
                      ? "opacity-35"
                      : ""
              }`}
            >
              <span className={isActive ? "text-amber-300" : isSpent ? "text-slate-600" : "text-slate-300"}>
                <Icon name={isSpent ? "check" : "sparkles"} size={15} />
              </span>
              <span
                className={`text-[10.5px] font-black leading-tight ${
                  isActive ? "text-amber-300" : isSpent ? "text-slate-600" : "text-white"
                }`}
              >
                {p.label}
              </span>
              <span
                className={`text-[9px] font-semibold leading-tight tabular-nums ${
                  isActive && secondsLeft !== null ? "text-amber-300" : "text-slate-500"
                }`}
              >
                {isActive
                  ? secondsLeft !== null
                    ? `${secondsLeft}s left`
                    : "In play"
                  : isSpent
                    ? "Used"
                    : isPending
                      ? "Tap to confirm"
                      : p.short}
              </span>
            </button>
          );
        })}
      </div>

      {active === "deep-dive" && secondsLeft !== null && (
        <p className="mt-2 text-center text-[11px] font-bold text-amber-300/90">
          Reroll freely — you lock in automatically in {secondsLeft}s.
        </p>
      )}

      {pending && (
        <p className="mt-2 text-center text-[11px] font-semibold text-amber-300/90">
          {POWERUPS.find((p) => p.id === pending)?.confirm}{" "}This can&apos;t be undone.
        </p>
      )}
    </div>
  );
}
