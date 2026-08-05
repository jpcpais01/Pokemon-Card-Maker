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

/**
 * Shared front face for the three trait cards. Each is a color-coded panel with
 * the trait glyph floated large and faint behind the label, so the cards read as
 * designed objects rather than an emoji stacked on a word.
 */
function TraitFace({
  glyph,
  label,
  kicker,
  gradient,
  text,
}: {
  glyph: string;
  label: string;
  kicker: string;
  gradient: string;
  text: string;
}) {
  return (
    <div className={`relative flex h-full flex-col justify-end overflow-hidden bg-gradient-to-br p-3 ${gradient}`}>
      {/* Oversized watermark glyph - bleeds off the corner for depth. */}
      <span className="pointer-events-none absolute -right-3 -top-4 select-none text-[5.5rem] leading-none opacity-25 drop-shadow-sm">
        {glyph}
      </span>
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{ background: "linear-gradient(to top, rgb(0 0 0 / 45%), transparent)" }}
      />
      <div className={`relative ${text}`}>
        <p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-75">{kicker}</p>
        <p className="mt-0.5 text-[15px] font-black leading-[1.15] drop-shadow-sm">{label}</p>
      </div>
    </div>
  );
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
        <TraitFace
          glyph={ART_TYPE_ICONS[artType.value]}
          label={artType.label}
          kicker="Art Type"
          gradient="from-amber-300 via-amber-500 to-orange-600"
          text="text-[#2a1705]"
        />
      ),
    },
    {
      key: "specialForm",
      label: "Special Form",
      rare: specialForm.value !== "none",
      front: (
        <TraitFace
          glyph={SPECIAL_FORM_ICONS[specialForm.value]}
          label={specialForm.label}
          kicker="Special Form"
          gradient="from-violet-400 via-purple-500 to-indigo-700"
          text="text-white"
        />
      ),
    },
    {
      key: "vibe",
      label: "Vibe",
      front: (
        <TraitFace
          glyph={VIBE_ICONS[vibe.value]}
          label={vibe.label}
          kicker="Vibe"
          gradient="from-teal-300 via-cyan-500 to-sky-700"
          text="text-white"
        />
      ),
    },
    ...pokemons.map((p, i) => ({
      key: i,
      label: pokemons.length > 1 ? `Pokemon ${i + 1}` : "Pokemon",
      front: (
        <div className="relative flex h-full flex-col items-center justify-end overflow-hidden bg-gradient-to-b from-slate-100 via-white to-slate-200">
          {/* Faint radial spotlight behind the sprite so it sits in a scene. */}
          <span
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 42%, rgb(148 163 184 / 28%), transparent 62%)" }}
          />
          <span className="absolute left-2 top-1.5 text-[9px] font-black tabular-nums text-slate-400">
            #{String(p.id).padStart(3, "0")}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.artworkUrl}
            alt={p.displayName}
            className="relative h-[74%] w-full object-contain p-1 drop-shadow-[0_6px_10px_rgba(15,23,42,0.28)]"
            loading="lazy"
          />
          <div className="relative w-full bg-slate-900 py-1.5 text-center text-[13px] font-black tracking-tight text-white">
            {p.displayName}
          </div>
        </div>
      ),
    })),
  ];
}
