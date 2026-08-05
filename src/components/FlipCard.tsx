"use client";

import type { ReactNode } from "react";
import Icon from "@/components/ui/Icon";
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
  const canReroll = revealed && !!onReroll && !!rerollsLeft;

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
    if (!canReroll) return;
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
        className={`absolute inset-0 overflow-hidden rounded-2xl border transition-all duration-300 ease-out disabled:cursor-default ${
          rare ? "border-amber-300/45" : "border-white/12"
        } ${revealed ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100"}`}
        style={{ boxShadow: "0 12px 26px -14px rgb(0 0 0 / 90%)" }}
      >
        <CardBack label={label} rare={rare} />
      </button>

      <button
        type="button"
        onClick={handleReroll}
        disabled={!canReroll}
        aria-label={onReroll ? `Reroll ${label}` : undefined}
        className={`absolute inset-0 overflow-hidden rounded-2xl border text-left transition-all duration-300 ease-out active:scale-[0.97] disabled:cursor-default disabled:active:scale-100 ${
          rare ? "border-amber-300/55" : "border-white/12"
        } ${revealed ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"}`}
        style={{
          boxShadow: rare
            ? "0 14px 30px -14px rgb(0 0 0 / 90%), 0 0 22px -8px rgb(255 201 75 / 55%)"
            : "0 12px 26px -14px rgb(0 0 0 / 90%)",
        }}
      >
        {front}
        {rare && revealed && <div className="holo-sheen" />}
        {/* Reroll affordance - the old build gave no hint the card was tappable
            again, so the reroll budget went unnoticed. */}
        {canReroll && (
          <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white/90 backdrop-blur-sm">
            <Icon name="reroll" size={13} strokeWidth={2.2} />
          </span>
        )}
      </button>
    </div>
  );
}

function CardBack({ label, rare }: { label: string; rare?: boolean }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#141428] to-[#0a0a14] p-3 text-center">
      {rare && <div className="holo-sheen opacity-25" />}
      {/* Concentric ring motif - reads as a pack back rather than a blank tile. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[95%] w-[95%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07]"
      />
      <span
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${
          rare
            ? "border-amber-300/35 bg-amber-400/15 text-amber-200"
            : "border-white/10 bg-white/[0.06] text-slate-400"
        }`}
      >
        <Icon name="sparkles" size={18} />
      </span>
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">{label}</p>
        <p className="mt-0.5 text-[9.5px] font-semibold text-slate-600">Tap to reveal</p>
      </div>
    </div>
  );
}
