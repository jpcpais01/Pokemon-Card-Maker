import type { ArtType, Region, SpecialForm } from "./types";

export const ART_TYPE_ICONS: Record<ArtType, string> = {
  ex: "⚔️",
  "illustration-rare": "🌟",
  "special-illustration-rare": "💎",
};

export const SPECIAL_FORM_ICONS: Record<SpecialForm, string> = {
  none: "●",
  shiny: "✨",
  mega: "🔆",
  "gold-star": "⭐",
  "tag-team": "🤝",
  ancient: "🦴",
  future: "🤖",
  "delta-species": "δ",
};

export const REGION_ICONS: Record<Region, string> = {
  default: "🌐",
  alolan: "🌺",
  galarian: "⚔️",
  hisuian: "🏮",
  paldean: "🍇",
};
