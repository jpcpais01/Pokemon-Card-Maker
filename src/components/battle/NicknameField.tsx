"use client";

import { NICKNAME_MAX_LENGTH } from "@/lib/battle/nickname";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** Whether what's typed so far will survive the server's sanitizing - the shared gate the
 *  form's submit button and the API agree on. Whitespace alone is not a name. */
export function isNicknameUsable(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * The "what should everyone call you" field, shown on every way into a multiplayer room.
 *
 * Required: in a room full of other people the nickname is how anyone tells the cards apart,
 * so the submit button stays disabled until it's filled in.
 */
export default function NicknameField({ value, onChange }: Props) {
  return (
    <div>
      <p className="section-label mb-2">Your nickname</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={NICKNAME_MAX_LENGTH}
        placeholder="What should everyone call you?"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        required
        aria-label="Your nickname for this match"
        className="card w-full px-4 py-3.5 text-[15px] font-semibold text-white placeholder:font-normal placeholder:text-slate-600 focus:border-amber-300/50 focus:outline-none"
      />
      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        Just for this match — everyone sees it on your cards and the scoreboard.
      </p>
    </div>
  );
}
