import type { ReactNode } from "react";
import { ART_TYPE_ICONS, SPECIAL_FORM_ICONS, VIBE_ICONS } from "@/lib/icons";
import type { ArtType, PokemonPick, SpecialForm, Vibe, WeightedOption } from "@/lib/types";

export type CardKey = "artType" | "specialForm" | "vibe" | number;

export interface CardFace {
  key: CardKey;
  label: string;
  front: ReactNode;
  /** Reveal this with the celebratory "rare pull" sound/vibration instead of a standard flip. */
  rare?: boolean;
}

/** Builds the four/five FlipCard front faces shared by solo play and battle mode. */
export function buildCardFaces(
  artType: WeightedOption<ArtType>,
  specialForm: WeightedOption<SpecialForm>,
  vibe: WeightedOption<Vibe>,
  pokemons: PokemonPick[]
): CardFace[] {
  return [
    {
      key: "artType",
      label: "Art Type",
      rare: artType.value === "special-illustration-rare",
      front: (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 p-3 text-center text-slate-900">
          <span className="text-4xl drop-shadow-sm">{ART_TYPE_ICONS[artType.value]}</span>
          <span className="text-lg font-black leading-tight">{artType.label}</span>
        </div>
      ),
    },
    {
      key: "specialForm",
      label: "Special Form",
      rare: specialForm.value !== "none",
      front: (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-700 p-3 text-center text-white">
          <span className="text-4xl drop-shadow-sm">{SPECIAL_FORM_ICONS[specialForm.value]}</span>
          <span className="text-lg font-black leading-tight">{specialForm.label}</span>
        </div>
      ),
    },
    {
      key: "vibe",
      label: "Vibe",
      front: (
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-teal-300 via-cyan-500 to-sky-700 p-3 text-center text-white">
          <span className="text-4xl drop-shadow-sm">{VIBE_ICONS[vibe.value]}</span>
          <span className="text-lg font-black leading-tight">{vibe.label}</span>
        </div>
      ),
    },
    ...pokemons.map((p, i) => ({
      key: i,
      label: pokemons.length > 1 ? `Pokemon ${i + 1}` : "Pokemon",
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
}
