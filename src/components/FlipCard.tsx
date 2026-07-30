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
      className="group relative aspect-[5/7] w-full [perspective:1200px] disabled:cursor-default"
    >
      <div
        className={`relative h-full w-full rounded-3xl transition-transform duration-700 ease-out [transform-style:preserve-3d] ${
          revealed ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Back */}
        <div className="card-sheen glass absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-3 text-center shadow-lg shadow-black/30 transition-transform duration-200 group-active:scale-[0.97] [backface-visibility:hidden]">
          <div className="absolute inset-2 rounded-2xl border border-amber-300/15" />
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-400/10 text-2xl">
            {ready ? "❓" : "⏳"}
          </span>
          <span className="mt-2.5 text-[11px] font-bold uppercase tracking-wider text-amber-200/90">
            {label}
          </span>
          {ready && <span className="mt-1 text-[10px] text-slate-400">Tap to reveal</span>}
        </div>

        {/* Front */}
        <div
          className={`card-sheen absolute inset-0 rounded-3xl border border-white/20 shadow-xl shadow-black/30 [backface-visibility:hidden] [transform:rotateY(180deg)] ${
            frontClassName ?? ""
          }`}
        >
          {front}
        </div>
      </div>
    </button>
  );
}
