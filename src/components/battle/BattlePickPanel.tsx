"use client";

import { useState } from "react";
import FlipCard from "@/components/FlipCard";
import { buildCardFaces, type CardKey } from "@/lib/cardFaces";
import type { BattlePlayerPick } from "@/lib/battle/types";

interface Props {
  pick: BattlePlayerPick;
  rerollsLeft: number;
  unlimitedRerolls?: boolean;
  locked: boolean;
  busy: boolean;
  onReroll: (key: CardKey) => void;
  onLock: () => void;
  forcedKeys?: CardKey[];
}

/**
 * The local player's own pick panel for a battle round. Remount this with a
 * `key` on the round number so its reveal state resets fresh each round.
 */
export default function BattlePickPanel({
  pick,
  rerollsLeft,
  unlimitedRerolls,
  locked,
  busy,
  onReroll,
  onLock,
  forcedKeys = [],
}: Props) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  // The 2nd Tag Team card only appears once Special Form has actually been revealed as such -
  // otherwise its mere presence would spoil the surprise before the player taps that card.
  const specialFormRevealed = locked || !!revealed.specialForm;
  const visiblePokemons = specialFormRevealed ? pick.pokemons : pick.pokemons.slice(0, 1);
  const faces = buildCardFaces(pick.artType, pick.specialForm, pick.vibe, visiblePokemons).map((face) =>
    forcedKeys.includes(face.key) ? { ...face, rare: false } : face
  );

  const allRevealed = faces.every((face) => revealed[String(face.key)]);

  return (
    <div>
      <p className="mb-4 text-center text-xs font-semibold text-slate-400">
        {unlimitedRerolls ? (
          <>
            <span className="text-amber-300">↻ ∞</span> rerolls
          </>
        ) : (
          <>
            <span className="text-amber-300">↻ {rerollsLeft}</span> reroll{rerollsLeft === 1 ? "" : "s"} left
          </>
        )}
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        {faces.map((face) => (
          <div key={face.key} className="w-[calc(50%-0.5rem)]">
            <FlipCard
              label={face.label}
              revealed={locked || !!revealed[String(face.key)]}
              onReveal={() => setRevealed((prev) => ({ ...prev, [String(face.key)]: true }))}
              front={face.front}
              rerollsLeft={unlimitedRerolls ? Infinity : rerollsLeft}
              onReroll={forcedKeys.includes(face.key) ? undefined : () => onReroll(face.key)}
              rare={face.rare}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onLock}
        disabled={!allRevealed || locked || busy}
        className="btn-primary mt-8 w-full transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {locked ? "Waiting for opponent..." : "Lock In"}
      </button>
    </div>
  );
}
