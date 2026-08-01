"use client";

import type { ReactNode } from "react";
import { playFlipSound, playRareChime, playRerollSound, vibrate } from "@/lib/soundFx";

interface Props {
  label: string;
  revealed: boolean;
  onReveal: () => void;
  front: ReactNode;
  rerollsLeft?: number;
  onReroll?: () => void;
  /** Plays a brighter chime + stronger vibration on reveal instead of the standard flip feedback. */
  rare?: boolean;
}

/**
 * Reveals a card via a simple opacity/scale cross-fade driven directly by the
 * `revealed` prop - no local timers or 3D transforms, which flicker on some
 * mobile browsers when combined with backdrop-filter/blend-mode.
 */
export default function FlipCard({ label, revealed, onReveal, front, rerollsLeft, onReroll, rare }: Props) {
  function handleReveal() {
    if (revealed) return;
    if (rare) {
      playRareChime();
      vibrate([20, 40, 20, 40, 60]);
    } else {
      playFlipSound();
      vibrate(15);
    }
    onReveal();
  }

  function handleReroll() {
    if (!revealed) return;
    playRerollSound();
    vibrate(12);
    onReroll?.();
  }

  return (
    <div className="relative aspect-[5/7] w-full">
      <button
        type="button"
        onClick={handleReveal}
        disabled={revealed}
        aria-label={`Reveal ${label}`}
        aria-hidden={revealed}
        tabIndex={revealed ? -1 : 0}
        className={`absolute inset-0 overflow-hidden rounded-3xl border border-white/15 shadow-xl shadow-black/30 transition-all duration-300 ease-out disabled:cursor-default ${
          revealed ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <CardBack label={label} />
      </button>

      <button
        type="button"
        onClick={handleReroll}
        disabled={!revealed || !onReroll || !rerollsLeft}
        aria-label={onReroll ? `Reroll ${label}` : undefined}
        className={`absolute inset-0 overflow-hidden rounded-3xl border border-white/15 text-left shadow-xl shadow-black/30 transition-all duration-300 ease-out active:scale-[0.97] disabled:cursor-default disabled:active:scale-100 ${
          revealed ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        }`}
      >
        {front}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />
      </button>
    </div>
  );
}

function CardBack({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-slate-800 via-slate-900 to-black p-3 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-400/10 text-2xl text-amber-300">
        ?
      </span>
      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200/80">{label}</span>
      <span className="text-[10px] text-slate-500">Tap to reveal</span>
    </div>
  );
}
