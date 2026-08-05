"use client";

import { useState } from "react";
import FlipCard from "@/components/FlipCard";
import Icon from "@/components/ui/Icon";
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

  const revealedCount = faces.filter((f) => locked || revealed[String(f.key)]).length;

  return (
    <div>
      {/* Same progress rail as solo reveal, so the two flows feel like one game. */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {faces.map((f) => (
            <span
              key={String(f.key)}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                locked || revealed[String(f.key)] ? "bg-amber-300" : "bg-white/12"
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] font-bold tabular-nums text-slate-400">
          {revealedCount}/{faces.length}
        </span>
        <span className={`chip chip-sm! ${unlimitedRerolls || rerollsLeft > 0 ? "chip-gold" : "chip-teal opacity-50"}`}>
          <Icon name="reroll" size={10} strokeWidth={2.6} />
          {unlimitedRerolls ? "∞" : rerollsLeft}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {faces.map((face, i) => (
          <div key={face.key} className="pop-in" style={{ "--d": `${i * 70}ms` } as React.CSSProperties}>
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
        className="btn-primary mt-6 w-full disabled:opacity-50"
      >
        {locked ? (
          "Waiting for opponent..."
        ) : (
          <>
            <Icon name="check" size={17} />
            Lock In
          </>
        )}
      </button>
    </div>
  );
}
