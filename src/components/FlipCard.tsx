"use client";

import type { ReactNode } from "react";

interface Props {
  label: string;
  revealed: boolean;
  ready: boolean;
  onReveal: () => void;
  front: ReactNode;
  frontClassName?: string;
}

export default function FlipCard({ label, revealed, ready, onReveal, front, frontClassName }: Props) {
  return (
    <button
      type="button"
      onClick={() => ready && !revealed && onReveal()}
      disabled={!ready || revealed}
      aria-label={revealed ? label : `Reveal ${label}`}
      className="relative aspect-[5/7] w-full [perspective:1200px] disabled:cursor-default"
    >
      <div
        className={`relative h-full w-full rounded-2xl transition-transform duration-700 ease-out [transform-style:preserve-3d] ${
          revealed ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Back */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-slate-800 via-slate-900 to-black p-3 text-center [backface-visibility:hidden]">
          <div className="absolute inset-2 rounded-xl border border-amber-400/20" />
          <span className="text-3xl">{ready ? "❓" : "⏳"}</span>
          <span className="mt-2 text-[11px] font-bold uppercase tracking-wider text-amber-300/90">
            {label}
          </span>
          {ready && (
            <span className="mt-1 text-[10px] text-slate-500">Tap to reveal</span>
          )}
        </div>

        {/* Front */}
        <div
          className={`absolute inset-0 overflow-hidden rounded-2xl border-2 border-amber-300/60 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] ${
            frontClassName ?? ""
          }`}
        >
          {front}
        </div>
      </div>
    </button>
  );
}
