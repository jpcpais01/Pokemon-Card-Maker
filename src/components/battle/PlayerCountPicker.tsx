"use client";

import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/battle/types";

interface Props {
  value: number;
  onChange: (n: number) => void;
  label?: string;
}

const OPTIONS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i);

export default function PlayerCountPicker({ value, onChange, label = "Players" }: Props) {
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={`rounded-xl border py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
              value === n
                ? "border-amber-300/70 bg-amber-400/15 text-amber-200 shadow-[0_0_20px_-4px_rgba(251,191,36,0.5)]"
                : "border-white/10 bg-white/[0.03] text-slate-400"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
