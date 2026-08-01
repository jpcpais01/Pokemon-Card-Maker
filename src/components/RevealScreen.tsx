"use client";

import FlipCard from "./FlipCard";
import { buildCardFaces, type CardKey } from "@/lib/cardFaces";
import { playFlipSound, playRareChime, vibrate } from "@/lib/soundFx";
import type { ArtType, PokemonPick, SpecialForm, Vibe, WeightedOption } from "@/lib/types";

export interface RevealData {
  artType: WeightedOption<ArtType>;
  specialForm: WeightedOption<SpecialForm>;
  vibe: WeightedOption<Vibe>;
  pokemons: PokemonPick[];
}

export interface RevealFlags {
  artType: boolean;
  specialForm: boolean;
  vibe: boolean;
  pokemons: boolean[];
}

export type { CardKey };

interface Props {
  data: RevealData;
  flags: RevealFlags;
  onReveal: (key: CardKey) => void;
  allRevealed: boolean;
  onRevealAll: () => void;
  onGenerate: () => void;
  onBack: () => void;
  rerollsLeft: number;
  onReroll: (key: CardKey) => void;
  /** Traits fixed by the current game mode (e.g. Only SIRs, Tag Teams) - not rerollable, and never
   *  flagged as a "rare pull" chime since they're guaranteed rather than a surprise. */
  forcedKeys?: CardKey[];
  eyebrow?: string;
}

export default function RevealScreen({
  data,
  flags,
  onReveal,
  allRevealed,
  onRevealAll,
  onGenerate,
  onBack,
  rerollsLeft,
  onReroll,
  forcedKeys = [],
  eyebrow = "Your Pack",
}: Props) {
  // The 2nd Tag Team card only appears once Special Form has actually been revealed as such -
  // otherwise its mere presence would spoil the surprise before the player taps that card.
  const visiblePokemons = flags.specialForm ? data.pokemons : data.pokemons.slice(0, 1);
  const faces = buildCardFaces(data.artType, data.specialForm, data.vibe, visiblePokemons);
  const cards = faces.map((face) => ({
    ...face,
    revealed: typeof face.key === "number" ? flags.pokemons[face.key] : flags[face.key],
    rare: forcedKeys.includes(face.key) ? false : face.rare,
  }));

  return (
    <div className="flex min-h-dvh flex-col px-5 py-8">
      <div className="mx-auto w-full max-w-sm flex-1">
        <div className="glass mb-6 flex items-center justify-between rounded-2xl px-4 py-3">
          <button onClick={onBack} className="text-sm font-semibold text-slate-300 active:text-white">
            ← Gens
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">{eyebrow}</p>
          <button
            onClick={() => {
              const anyHiddenRare = cards.some((c) => !c.revealed && c.rare);
              if (anyHiddenRare) {
                playRareChime();
                vibrate([20, 40, 20, 40, 60]);
              } else {
                playFlipSound();
                vibrate(15);
              }
              onRevealAll();
            }}
            disabled={allRevealed}
            className="text-sm font-semibold text-amber-300 active:text-amber-100 disabled:opacity-0"
          >
            Reveal all
          </button>
        </div>

        <p className="mb-4 text-center text-xs font-semibold text-slate-400">
          <span className="text-amber-300">↻ {rerollsLeft}</span> reroll{rerollsLeft === 1 ? "" : "s"} left
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {cards.map((card) => (
            <div key={card.key} className="w-[calc(50%-0.5rem)]">
              <FlipCard
                label={card.label}
                revealed={card.revealed}
                onReveal={() => onReveal(card.key)}
                front={card.front}
                rerollsLeft={rerollsLeft}
                onReroll={forcedKeys.includes(card.key) ? undefined : () => onReroll(card.key)}
                rare={card.rare}
              />
            </div>
          ))}
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
