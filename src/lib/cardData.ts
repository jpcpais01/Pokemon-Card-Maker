import type { ArtType, SpecialForm, Vibe, WeightedOption } from "./types";

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
      "Ultra-premium, gallery-quality full-art illustration with an elaborate background and extra environmental storytelling, rendered in one bold, distinctive fine-art technique that makes it look unlike any other card.",
  },
];

// One combined pool: special forms (Shiny, Mega, ...) and regional forms (Alolan, Galarian, ...)
// are mutually exclusive outcomes of a single roll/card now, not two independent traits. Each
// non-"none" entry keeps the exact weight it had on its own former axis; "none" absorbs whatever
// share is left over so the whole table still sums to 100 and reads directly as percentages.
export const SPECIAL_FORMS: WeightedOption<SpecialForm>[] = [
  { value: "none", label: "Standard", weight: 57, blurb: "Regular, standard form." },
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
  { value: "alolan", label: "Alolan", weight: 7.5, blurb: "Alolan regional form, tropical island styling." },
  { value: "galarian", label: "Galarian", weight: 6, blurb: "Galarian regional form, British-isles inspired styling." },
  { value: "hisuian", label: "Hisuian", weight: 3.5, blurb: "Hisuian regional form, ancient feudal-Japan inspired styling." },
  { value: "paldean", label: "Paldean", weight: 2, blurb: "Paldean regional form, Iberian-inspired styling." },
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

// The mood/atmosphere the illustration is rendered in - all 20 equally likely (weight 5 each,
// summing to 100 like the other tables). Unlike Special Form there's no "none"/default entry:
// every card always gets one of these vibes.
export const VIBES: WeightedOption<Vibe>[] = [
  { value: "cozy", label: "Cozy", weight: 5, blurb: "Warm, soft, inviting atmosphere with gentle candlelit glow." },
  { value: "menacing", label: "Menacing", weight: 5, blurb: "Dark, threatening mood with harsh shadows and a looming presence." },
  { value: "serene", label: "Serene", weight: 5, blurb: "Calm, peaceful stillness bathed in soft, even light." },
  { value: "chaotic", label: "Chaotic", weight: 5, blurb: "Wild, frenzied energy with clashing motion and scattered debris." },
  { value: "majestic", label: "Majestic", weight: 5, blurb: "Grand, regal, awe-inspiring scale with sweeping composition." },
  { value: "playful", label: "Playful", weight: 5, blurb: "Lighthearted, whimsical energy with bouncy motion and bright colors." },
  { value: "melancholic", label: "Melancholic", weight: 5, blurb: "Wistful, bittersweet mood with muted tones and quiet stillness." },
  { value: "triumphant", label: "Triumphant", weight: 5, blurb: "Victorious, heroic mood bathed in radiant golden light." },
  { value: "mysterious", label: "Mysterious", weight: 5, blurb: "Shadowy, enigmatic atmosphere with secrets half-hidden in fog." },
  { value: "electric", label: "Electric", weight: 5, blurb: "Crackling high-voltage energy with vivid neon-tinged light." },
  { value: "dreamy", label: "Dreamy", weight: 5, blurb: "Hazy, surreal atmosphere with soft pastel colors and floating light." },
  { value: "fierce", label: "Fierce", weight: 5, blurb: "Aggressive, powerful, primal intensity with a raw, feral edge." },
  { value: "nostalgic", label: "Nostalgic", weight: 5, blurb: "Warm, sun-faded mood evoking a cherished half-remembered afternoon." },
  { value: "ethereal", label: "Ethereal", weight: 5, blurb: "Otherworldly, glowing atmosphere with soft celestial light." },
  { value: "rebellious", label: "Rebellious", weight: 5, blurb: "Edgy, defiant energy with bold contrast and gritty attitude." },
  { value: "wholesome", label: "Wholesome", weight: 5, blurb: "Warm-hearted, friendly mood under bright, cheerful sunlight." },
  { value: "ominous", label: "Ominous", weight: 5, blurb: "Foreboding atmosphere with heavy storm clouds and building dread." },
  { value: "vibrant", label: "Vibrant", weight: 5, blurb: "Explosively colorful, high-energy mood with bold saturated hues." },
  { value: "tranquil", label: "Tranquil", weight: 5, blurb: "Still, gentle, zen-like calm with soft natural light." },
  { value: "epic", label: "Epic", weight: 5, blurb: "Cinematic, larger-than-life mood with sweeping dramatic scale." },
];
