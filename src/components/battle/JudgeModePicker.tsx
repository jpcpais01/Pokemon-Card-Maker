"use client";

import type { JudgeMode } from "@/lib/battle/types";

interface Props {
  value: JudgeMode;
  onChange: (mode: JudgeMode) => void;
}

const OPTIONS: { value: JudgeMode; label: string }[] = [
  { value: "ai", label: "AI Judge" },
  { value: "vote", label: "Player Vote" },
];

export default function JudgeModePicker({ value, onChange }: Props) {
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Round Judge
      </p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={`rounded-xl border py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
              value === opt.value
                ? "border-amber-300/70 bg-amber-400/15 text-amber-200 shadow-[0_0_20px_-4px_rgba(251,191,36,0.5)]"
                : "border-white/10 bg-white/[0.03] text-slate-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {value === "vote" && (
        <p className="mt-1.5 text-center text-[11px] leading-relaxed text-slate-500">
          Everyone votes anonymously on a card that isn&apos;t their own.
        </p>
      )}
    </div>
  );
}
