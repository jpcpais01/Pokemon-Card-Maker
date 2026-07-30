"use client";

import { GENERATIONS } from "@/lib/generations";

interface Props {
  selected: number[];
  onChange: (gens: number[]) => void;
  onStart: () => void;
  loading: boolean;
  error: string | null;
}

export default function GenSelector({ selected, onChange, onStart, loading, error }: Props) {
  const allSelected = selected.length === GENERATIONS.length;

  function toggle(id: number) {
    if (selected.includes(id)) {
      if (selected.length === 1) return;
      onChange(selected.filter((g) => g !== id));
    } else {
      onChange([...selected, id].sort((a, b) => a - b));
    }
  }

  function toggleAll() {
    onChange(allSelected ? [GENERATIONS[0].id] : GENERATIONS.map((g) => g.id));
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
            Pokemon Card Generator
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Open a Pack</h1>
          <p className="mt-2 text-sm text-slate-400">
            Choose which generations can appear, then open your pack for four random traits.
          </p>
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
                className={`flex flex-col items-center justify-center rounded-xl border px-2 py-3 transition-all active:scale-95 ${
                  active
                    ? "border-amber-400 bg-amber-400/15 text-amber-300 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]"
                    : "border-slate-700 bg-slate-800/50 text-slate-400"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wide">Gen {gen.roman}</span>
                <span className="mt-0.5 text-[11px] opacity-80">{gen.region}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={toggleAll}
          className="mt-3 w-full rounded-lg border border-slate-700 py-2 text-xs font-semibold text-slate-300 transition-colors active:bg-slate-800"
        >
          {allSelected ? "Deselect all" : "Select all generations"}
        </button>

        {error && (
          <p className="mt-4 rounded-lg bg-red-950/60 px-3 py-2 text-center text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onStart}
          disabled={loading || selected.length === 0}
          className="mt-8 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Loading Pokedex..." : "Open Pack"}
        </button>
      </div>
    </div>
  );
}
