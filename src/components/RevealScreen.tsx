"use client";

import FlipCard from "./FlipCard";
import { ART_TYPE_ICONS, REGION_ICONS, SPECIAL_FORM_ICONS } from "@/lib/icons";
import type { ArtType, PokemonPick, Region, SpecialForm, WeightedOption } from "@/lib/types";

export interface RevealData {
  artType: WeightedOption<ArtType>;
  specialForm: WeightedOption<SpecialForm>;
  region: WeightedOption<Region>;
  pokemons: PokemonPick[];
}

export interface RevealFlags {
  artType: boolean;
  specialForm: boolean;
  region: boolean;
  pokemons: boolean[];
}

interface Props {
  data: RevealData;
  flags: RevealFlags;
  onReveal: (key: "artType" | "specialForm" | "region" | number) => void;
  allRevealed: boolean;
  onRevealAll: () => void;
  onGenerate: () => void;
  onBack: () => void;
}

export default function RevealScreen({ data, flags, onReveal, allRevealed, onRevealAll, onGenerate, onBack }: Props) {
  const cards = [
    {
      key: "artType" as const,
      label: "Art Type",
      revealed: flags.artType,
      front: (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 p-3 text-center text-slate-900">
          <span className="text-4xl drop-shadow-sm">{ART_TYPE_ICONS[data.artType.value]}</span>
          <span className="text-lg font-black leading-tight">{data.artType.label}</span>
        </div>
      ),
    },
    {
      key: "specialForm" as const,
      label: "Special Form",
      revealed: flags.specialForm,
      front: (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-700 p-3 text-center text-white">
          <span className="text-4xl drop-shadow-sm">{SPECIAL_FORM_ICONS[data.specialForm.value]}</span>
          <span className="text-lg font-black leading-tight">{data.specialForm.label}</span>
        </div>
      ),
    },
    {
      key: "region" as const,
      label: "Regional Form",
      revealed: flags.region,
      front: (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-teal-300 via-emerald-500 to-cyan-700 p-3 text-center text-slate-900">
          <span className="text-4xl drop-shadow-sm">{REGION_ICONS[data.region.value]}</span>
          <span className="text-lg font-black leading-tight">{data.region.label}</span>
        </div>
      ),
    },
    ...data.pokemons.map((p, i) => ({
      key: i,
      label: data.pokemons.length > 1 ? `Pokemon ${i + 1}` : "Pokemon",
      revealed: flags.pokemons[i],
      front: (
        <div className="relative flex h-full flex-col items-center justify-end bg-gradient-to-b from-slate-50 to-white">
          <span className="absolute left-2 top-1.5 text-[10px] font-bold text-slate-400">
            #{String(p.id).padStart(3, "0")}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.artworkUrl}
            alt={p.displayName}
            className="h-[75%] w-full object-contain p-1"
            loading="lazy"
          />
          <div className="w-full bg-slate-900/95 py-1.5 text-center text-sm font-bold text-white backdrop-blur">
            {p.displayName}
          </div>
        </div>
      ),
    })),
  ];

  return (
    <div className="flex min-h-dvh flex-col px-5 py-8">
      <div className="mx-auto w-full max-w-sm flex-1">
        <div className="glass mb-6 flex items-center justify-between rounded-2xl px-4 py-3">
          <button onClick={onBack} className="text-sm font-semibold text-slate-300 active:text-white">
            ← Gens
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Your Pack</p>
          <button
            onClick={onRevealAll}
            disabled={allRevealed}
            className="text-sm font-semibold text-amber-300 active:text-amber-100 disabled:opacity-0"
          >
            Reveal all
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {cards.map((card) =>
            typeof card.key === "number" && data.pokemons.length % 2 === 1 && card.key === data.pokemons.length - 1 && cards.length % 2 === 1 ? (
              <div key={card.key} className="col-span-2 flex justify-center">
                <div className="w-[calc(50%-0.5rem)]">
                  <FlipCard
                    label={card.label}
                    revealed={card.revealed}
                    ready
                    onReveal={() => onReveal(card.key)}
                    front={card.front}
                  />
                </div>
              </div>
            ) : (
              <FlipCard
                key={card.key}
                label={card.label}
                revealed={card.revealed}
                ready
                onReveal={() => onReveal(card.key)}
                front={card.front}
              />
            )
          )}
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-sm">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!allRevealed}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-0"
        >
          Generate Card Artwork
        </button>
      </div>
    </div>
  );
}
