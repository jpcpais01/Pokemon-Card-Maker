"use client";

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function UnlimitedRerollsToggle({ value, onChange }: Props) {
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Rerolls
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange(false)}
          aria-pressed={!value}
          className={`rounded-xl border py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
            !value
              ? "border-amber-300/70 bg-amber-400/15 text-amber-200 shadow-[0_0_20px_-4px_rgba(251,191,36,0.5)]"
              : "border-white/10 bg-white/[0.03] text-slate-400"
          }`}
        >
          Standard
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          aria-pressed={value}
          className={`rounded-xl border py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
            value
              ? "border-amber-300/70 bg-amber-400/15 text-amber-200 shadow-[0_0_20px_-4px_rgba(251,191,36,0.5)]"
              : "border-white/10 bg-white/[0.03] text-slate-400"
          }`}
        >
          Unlimited ∞
        </button>
      </div>
    </div>
  );
}
