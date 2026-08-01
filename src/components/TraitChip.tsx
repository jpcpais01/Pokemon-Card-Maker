import type { ReactNode } from "react";

interface Props {
  tone: "gold" | "violet" | "teal";
  children: ReactNode;
  /** Tighter padding/font-size for chips packed into small grid tiles. */
  small?: boolean;
}

const TONE_CLASS: Record<Props["tone"], string> = {
  gold: "chip-gold",
  violet: "chip-violet",
  teal: "chip-teal",
};

/** Small pill tag for a card trait (art type / special form / vibe) - shared everywhere the same
 *  three trait chips get rendered (result screens, round results, gallery cards). */
export default function TraitChip({ tone, children, small }: Props) {
  return <span className={`chip ${TONE_CLASS[tone]} ${small ? "chip-sm!" : ""}`}>{children}</span>;
}
