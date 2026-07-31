import type { ArtType, Region, SpecialForm, WeightedOption } from "./types";

/**
 * Picks one option at random, respecting relative weights. Pass `exclude` to
 * guarantee a different result than the current one (used for rerolls).
 */
export function pickWeighted<T extends string>(
  options: WeightedOption<T>[],
  exclude?: T
): WeightedOption<T> {
  const candidates = exclude ? options.filter((o) => o.value !== exclude) : options;
  const pool = candidates.length > 0 ? candidates : options;
  const total = pool.reduce((sum, o) => sum + o.weight, 0);
  let roll = Math.random() * total;
  for (const option of pool) {
    roll -= option.weight;
    if (roll <= 0) return option;
  }
  return pool[pool.length - 1];
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

// Non-"none" weights are each exactly half of their original value (odds of getting any special
// form at all halved from 48% to 24%), with "none" absorbing the freed-up share so the weights
// still sum to 100 and read directly as percentages.
export const SPECIAL_FORMS: WeightedOption<SpecialForm>[] = [
  { value: "none", label: "Standard", weight: 76, blurb: "Regular, standard form." },
  { value: "shiny", label: "Shiny", weight: 8, blurb: "Rare shiny color palette." },
  { value: "mega", label: "Mega", weight: 4, blurb: "Mega Evolved form, more powerful and elaborate." },
  {
    value: "tag-team",
    label: "Tag Team",
    weight: 3.5,
    blurb: "Tag Team card featuring two Pokemon together as partners in one dynamic scene.",
  },
  { value: "ancient", label: "Ancient", weight: 3, blurb: "Primal, ancient prehistoric form, like a fossil-era relic." },
  { value: "future", label: "Future", weight: 3, blurb: "Futuristic, bio-mechanical paradox form." },
  { value: "gold-star", label: "Gold Star", weight: 1.5, blurb: "Ultra-rare Gold Star variant, radiant golden accents." },
  {
    value: "delta-species",
    label: "Delta Species",
    weight: 1,
    blurb: "Delta Species variant with an unexpected off-type elemental twist, marked with a δ symbol.",
  },
];

/**
 * Picks a special form, excluding Tag Team when the Pokemon pool is too small
 * to guarantee two distinct Pokemon (otherwise tag-team could roll the same
 * Pokemon twice).
 */
export function pickSpecialForm(poolSize: number, exclude?: SpecialForm): WeightedOption<SpecialForm> {
  const candidates = poolSize < 2 ? SPECIAL_FORMS.filter((f) => f.value !== "tag-team") : SPECIAL_FORMS;
  return pickWeighted(candidates, exclude);
}

// Non-"default" weights are each exactly half of their original value (odds of getting any
// regional form at all halved from 38% to 19%), with "default" absorbing the freed-up share so
// the weights still sum to 100 and read directly as percentages.
export const REGIONS: WeightedOption<Region>[] = [
  { value: "default", label: "Default", weight: 81, blurb: "Standard, original regional form." },
  { value: "alolan", label: "Alolan", weight: 7.5, blurb: "Alolan regional form, tropical island styling." },
  { value: "galarian", label: "Galarian", weight: 6, blurb: "Galarian regional form, British-isles inspired styling." },
  { value: "hisuian", label: "Hisuian", weight: 3.5, blurb: "Hisuian regional form, ancient feudal-Japan inspired styling." },
  { value: "paldean", label: "Paldean", weight: 2, blurb: "Paldean regional form, Iberian-inspired styling." },
];
