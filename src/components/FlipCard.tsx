"use client";

import type { ReactNode } from "react";

interface Props {
  label: string;
  revealed: boolean;
  onReveal: () => void;
  front: ReactNode;
  rerollsLeft?: number;
  onReroll?: () => void;
}

/**
 * Reveals a card via a simple opacity/scale cross-fade driven directly by the
 * `revealed` prop - no local timers or 3D transforms, which flicker on some
 * mobile browsers when combined with backdrop-filter/blend-mode.
 */
export default function FlipCard({ label, revealed, onReveal, front, rerollsLeft, onReroll }: Props) {
  return (
    <div className="relative aspect-[5/7] w-full">
      <button
        type="button"
        onClick={() => !revealed && onReveal()}
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

      <div
        className={`absolute inset-0 overflow-hidden rounded-3xl border border-white/15 shadow-xl shadow-black/30 transition-all duration-300 ease-out ${
          revealed ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        }`}
      >
        {front}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0" />

        {revealed && onReroll && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReroll();
            }}
            disabled={!rerollsLeft}
            aria-label={`Reroll ${label}`}
            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/55 text-sm text-white transition-transform active:scale-90 disabled:pointer-events-none disabled:opacity-30"
          >
            ↻
          </button>
        )}
      </div>
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
