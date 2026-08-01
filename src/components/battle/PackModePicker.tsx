"use client";

import type { PackMode } from "@/lib/types";

interface Props {
  value: PackMode;
  onChange: (mode: PackMode) => void;
}

const OPTIONS: { value: PackMode; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "sir", label: "Only SIRs" },
  { value: "tagteam", label: "Tag Teams" },
  { value: "tagteamsir", label: "Tag Team SIRs" },
];

export default function PackModePicker({ value, onChange }: Props) {
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Game Mode
      </p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={`rounded-xl border py-2.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
              value === opt.value
                ? "border-amber-300/70 bg-amber-400/15 text-amber-200 shadow-[0_0_20px_-4px_rgba(251,191,36,0.5)]"
                : "border-white/10 bg-white/[0.03] text-slate-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {value === "sir" && (
        <p className="mt-1.5 text-center text-[11px] leading-relaxed text-slate-500">
          Every pack is a Special Illustration Rare - art type is locked in for everyone.
        </p>
      )}
      {value === "tagteam" && (
        <p className="mt-1.5 text-center text-[11px] leading-relaxed text-slate-500">
          Every pack pairs up two Pokemon - special form is locked in for everyone.
        </p>
      )}
      {value === "tagteamsir" && (
        <p className="mt-1.5 text-center text-[11px] leading-relaxed text-slate-500">
          Every pack is a Special Illustration Rare Tag Team - art type and special form are both
          locked in for everyone.
        </p>
      )}
    </div>
  );
}
