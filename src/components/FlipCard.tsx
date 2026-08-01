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
        className={`absolute inset-0 overflow-hidden rounded-3xl border shadow-xl shadow-black/30 transition-all duration-300 ease-out disabled:cursor-default ${
          rare ? "border-amber-300/50" : "border-white/15"
        } ${revealed ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100"}`}
      >
        <CardBack label={label} rare={rare} />
      </button>

      <button
        type="button"
        onClick={handleReroll}
        disabled={!revealed || !onReroll || !rerollsLeft}
        aria-label={onReroll ? `Reroll ${label}` : undefined}
        className={`absolute inset-0 overflow-hidden rounded-3xl border text-left shadow-xl shadow-black/30 transition-all duration-300 ease-out active:scale-[0.97] disabled:cursor-default disabled:active:scale-100 ${
          rare ? "border-amber-300/60 shadow-amber-500/20" : "border-white/15"
        } ${revealed ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"}`}
      >
        {front}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />
        {rare && revealed && <div className="holo-sheen" />}
      </button>
    </div>
  );
}

function CardBack({ label, rare }: { label: string; rare?: boolean }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-2.5 overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-black p-3 text-center">
      {rare && <div className="holo-sheen opacity-30" />}
      <span
        className={`relative flex h-11 w-11 items-center justify-center rounded-full text-2xl ${
          rare ? "bg-amber-400/20 text-amber-200" : "bg-amber-400/10 text-amber-300"
        }`}
      >
        ?
      </span>
      <span className="relative text-[11px] font-bold uppercase tracking-wider text-amber-200/80">{label}</span>
      <span className="relative text-[10px] text-slate-500">Tap to reveal</span>
    </div>
  );
}
