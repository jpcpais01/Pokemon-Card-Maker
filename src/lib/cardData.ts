import type { ArtType, Region, SpecialForm, WeightedOption } from "./types";

/** Picks one option at random, respecting relative weights. */
export function pickWeighted<T extends string>(
  options: WeightedOption<T>[]
): WeightedOption<T> {
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * total;
  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) return option;
  }
  return options[options.length - 1];
}

export const ART_TYPES: WeightedOption<ArtType>[] = [
  {
    value: "ex",
    label: "ex",
    weight: 55,
    blurb: "Bold, dynamic full-art ex card with an action pose and dramatic lighting.",
  },
  {
    value: "illustration-rare",
    label: "Illustration Rare",
    weight: 32,
    blurb:
      "Whimsical, wide scenic full-art illustration showing the Pokemon in its natural habitat, storybook charm.",
  },
  {
    value: "special-illustration-rare",
    label: "Special Illustration Rare",
    weight: 13,
    blurb:
      "Ultra-premium, cinematic full-art illustration with an elaborate background, extra environmental storytelling, and painterly detail.",
  },
];

export const SPECIAL_FORMS: WeightedOption<SpecialForm>[] = [
  { value: "none", label: "Standard", weight: 52, blurb: "Regular, standard form." },
  { value: "shiny", label: "Shiny", weight: 16, blurb: "Rare shiny color palette." },
  { value: "mega", label: "Mega", weight: 8, blurb: "Mega Evolved form, more powerful and elaborate." },
  {
    value: "tag-team",
    label: "Tag Team",
    weight: 7,
    blurb: "Tag Team card featuring two Pokemon together as partners in one dynamic scene.",
  },
  { value: "ancient", label: "Ancient", weight: 6, blurb: "Primal, ancient prehistoric form, like a fossil-era relic." },
  { value: "future", label: "Future", weight: 6, blurb: "Futuristic, bio-mechanical paradox form." },
  { value: "gold-star", label: "Gold Star", weight: 3, blurb: "Ultra-rare Gold Star variant, radiant golden accents." },
  {
    value: "delta-species",
    label: "Delta Species",
    weight: 2,
    blurb: "Delta Species variant with an unexpected off-type elemental twist, marked with a δ symbol.",
  },
];

export const REGIONS: WeightedOption<Region>[] = [
  { value: "default", label: "Default", weight: 62, blurb: "Standard, original regional form." },
  { value: "alolan", label: "Alolan", weight: 15, blurb: "Alolan regional form, tropical island styling." },
  { value: "galarian", label: "Galarian", weight: 12, blurb: "Galarian regional form, British-isles inspired styling." },
  { value: "hisuian", label: "Hisuian", weight: 7, blurb: "Hisuian regional form, ancient feudal-Japan inspired styling." },
  { value: "paldean", label: "Paldean", weight: 4, blurb: "Paldean regional form, Iberian-inspired styling." },
];
