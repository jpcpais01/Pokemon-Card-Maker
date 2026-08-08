"use client";

import { NICKNAME_MAX_LENGTH } from "@/lib/battle/nickname";

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Shown when the field is left empty, so it's clear the name is optional. */
  fallback?: string;
}

/**
 * The "what should everyone call you" field, shown on every way into a multiplayer room.
 *
 * Optional on purpose: leaving it blank keeps the positional label the room used before
 * nicknames existed, so nobody is blocked at the door by a required field.
 */
export default function NicknameField({ value, onChange, fallback = "Opponent" }: Props) {
  return (
    <div>
      <p className="section-label mb-2">Your nickname</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={NICKNAME_MAX_LENGTH}
        placeholder={`Optional — you'll show up as "${fallback}"`}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Your nickname for this match"
        className="card w-full px-4 py-3.5 text-[15px] font-semibold text-white placeholder:font-normal placeholder:text-slate-600 focus:border-amber-300/50 focus:outline-none"
      />
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Just for this match — everyone sees it on your cards and the scoreboard.
      </p>
    </div>
  );
}
