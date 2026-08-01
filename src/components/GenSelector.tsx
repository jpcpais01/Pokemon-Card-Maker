"use client";

import type { ReactNode } from "react";
import { GENERATIONS } from "@/lib/generations";

interface Props {
  selected: number[];
  onChange: (gens: number[]) => void;
  onStart: () => void;
  loading: boolean;
  error: string | null;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  loadingLabel?: string;
  footer?: ReactNode;
  /** Rendered after the gen grid/select-all, before the error/start button - e.g. a player-count picker. */
  extraTop?: ReactNode;
}

export default function GenSelector({
  selected,
  onChange,
  onStart,
  loading,
  error,
  eyebrow = "PokeGen",
  title = "Open a Pack",
  subtitle = "Choose which generations can appear, then open your pack for four random traits.",
  buttonLabel = "Open Pack",
  loadingLabel = "Loading Pokedex...",
  footer,
  extraTop,
}: Props) {
  const allSelected = selected.length === GENERATIONS.length;

  function toggle(id: number) {
    if (selected.includes(id)) {
      onChange(selected.filter((g) => g !== id));
    } else {
      onChange([...selected, id].sort((a, b) => a - b));
    }
  }

  function toggleAll() {
    onChange(allSelected ? [] : GENERATIONS.map((g) => g.id));
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-8">
      <div className="glass-strong rise-in w-full max-w-sm rounded-[2rem] p-6 shadow-2xl shadow-black/40">
        <div className="mb-7 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-300/90">{eyebrow}</p>
          <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{subtitle}</p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {GENERATIONS.map((gen) => {
            const active = selected.includes(gen.id);
            return (
              <button
                key={gen.id}
                type="button"
                onClick={() => toggle(gen.id)}
                aria-pressed={active}
                className={`flex flex-col items-center justify-center rounded-2xl border px-2 py-3 transition-all duration-200 active:scale-95 ${
                  active
                    ? "border-amber-300/70 bg-amber-400/15 text-amber-200 shadow-[0_0_20px_-4px_rgba(251,191,36,0.5)]"
                    : "border-white/10 bg-white/[0.03] text-slate-500"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wide">{gen.label}</span>
                <span className="mt-0.5 text-[11px] opacity-80">{gen.region}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={toggleAll}
          className="glass mt-3 w-full rounded-xl py-2.5 text-xs font-semibold text-slate-300 transition-colors active:bg-white/10 active:scale-[0.98]"
        >
          {allSelected ? "Deselect all" : "Select all generations"}
        </button>

        {extraTop}

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onStart}
          disabled={loading || selected.length === 0}
          className="btn-primary mt-7 w-full transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
        >
          {loading ? loadingLabel : buttonLabel}
        </button>

        {footer}
      </div>
    </div>
  );
}
