"use client";

import FlipCard from "./FlipCard";
import Screen from "@/components/ui/Screen";
import Icon from "@/components/ui/Icon";
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

  const revealedCount = cards.filter((c) => c.revealed).length;

  return (
    <Screen
      immersive
      back={onBack}
      title={eyebrow}
      action={
        !allRevealed ? (
          <button
            type="button"
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
            className="btn-quiet -mr-2 !px-2 !text-amber-300"
          >
            Reveal all
          </button>
        ) : null
      }
    >
      <div className="screen-pad flex flex-1 flex-col">
        {/* Progress rail - turns "tap four cards" into a visible objective. */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex flex-1 gap-1.5">
            {cards.map((c) => (
              <span
                key={String(c.key)}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  c.revealed ? "bg-amber-300" : "bg-white/12"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold tabular-nums text-slate-400">
            {revealedCount}/{cards.length}
          </span>
          <span
            className={`chip chip-sm! ${rerollsLeft > 0 ? "chip-gold" : "chip-teal opacity-50"}`}
            title="Rerolls left"
          >
            <Icon name="reroll" size={10} strokeWidth={2.6} />
            {rerollsLeft}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {cards.map((card, i) => (
            <div
              key={card.key}
              className="pop-in"
              style={{ "--d": `${i * 70}ms` } as React.CSSProperties}
            >
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

        <p className="mt-5 text-center text-[11.5px] leading-relaxed text-slate-500">
          {allRevealed
            ? rerollsLeft > 0
              ? "Not happy with a trait? Tap it to reroll."
              : "No rerolls left — time to paint it."
            : "Tap each card to reveal what you pulled."}
        </p>
      </div>

      <div className="sticky bottom-0 z-20 mt-6">
        <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[#07070c] to-transparent" />
        <div
          className="screen-pad relative bg-[#07070c]"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.875rem)" }}
        >
          <button
            type="button"
            onClick={onGenerate}
            disabled={!allRevealed}
            className="btn-primary w-full transition-opacity duration-300 disabled:pointer-events-none disabled:opacity-0"
          >
            <Icon name="sparkles" size={17} />
            Paint the Artwork
          </button>
        </div>
      </div>
    </Screen>
  );
}
