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

// Every roll table in this file follows the same shape: the "default" outcome (the one that
// isn't a special pull) always lands 50% of the time, and the other 50% is split perfectly evenly
// across every other option - no per-option rarity gradient. A Delta Species pull is exactly as
// likely as a Shiny pull; Special Illustration Rare is exactly as likely as Illustration Rare.
const DEFAULT_SHARE = 50;

export const ART_TYPES: WeightedOption<ArtType>[] = [
  {
    value: "ex",
    label: "ex",
    weight: DEFAULT_SHARE,
    blurb: "Bold, dynamic full-art ex card with an action pose and dramatic lighting.",
  },
  {
    value: "illustration-rare",
    label: "Illustration Rare",
    weight: 25,
    blurb:
      "Whimsical, wide scenic full-art illustration showing the Pokemon in its natural habitat, storybook charm.",
  },
  {
    value: "special-illustration-rare",
    label: "Special Illustration Rare",
    weight: 25,
    blurb:
      "Ultra-premium, gallery-quality full-art illustration with an elaborate background and extra environmental storytelling, rendered in one bold, distinctive fine-art technique that makes it look unlike any other card.",
  },
];

// One combined pool: special forms (Shiny, Mega, ...) and regional forms (Alolan, Galarian, ...)
// are mutually exclusive outcomes of a single roll/card. "none" is the 50% default; the other 14
// entries below split the remaining 50% evenly (50/14 ≈ 3.5714 each) regardless of how rare any
// individual one might feel - see the DEFAULT_SHARE comment above.
const OTHER_FORM_SHARE = DEFAULT_SHARE / 14;

export const SPECIAL_FORMS: WeightedOption<SpecialForm>[] = [
  { value: "none", label: "Standard", weight: DEFAULT_SHARE, blurb: "Regular, standard form." },
  { value: "shiny", label: "Shiny", weight: OTHER_FORM_SHARE, blurb: "Rare shiny color palette." },
  { value: "mega", label: "Mega", weight: OTHER_FORM_SHARE, blurb: "Mega Evolved form, more powerful and elaborate." },
  {
    value: "tag-team",
    label: "Tag Team",
    weight: OTHER_FORM_SHARE,
    blurb: "Tag Team card featuring two Pokemon together as partners in one dynamic scene.",
  },
  {
    value: "triple-tag-team",
    label: "Triple Tag Team",
    weight: OTHER_FORM_SHARE,
    blurb: "Triple Tag Team card featuring three Pokemon together as partners in one dynamic scene.",
  },
  {
    value: "ancient",
    label: "Ancient",
    weight: OTHER_FORM_SHARE,
    blurb: "Primal, ancient prehistoric form, like a fossil-era relic.",
  },
  { value: "future", label: "Future", weight: OTHER_FORM_SHARE, blurb: "Futuristic, bio-mechanical paradox form." },
  {
    value: "gold-star",
    label: "Gold Star",
    weight: OTHER_FORM_SHARE,
    blurb: "Ultra-rare Gold Star variant, radiant golden accents.",
  },
  {
    value: "delta-species",
    label: "Delta Species",
    weight: OTHER_FORM_SHARE,
    blurb: "Delta Species variant with an unexpected off-type elemental twist, marked with a δ symbol.",
  },
  { value: "alolan", label: "Alolan", weight: OTHER_FORM_SHARE, blurb: "Alolan regional form, tropical island styling." },
  {
    value: "galarian",
    label: "Galarian",
    weight: OTHER_FORM_SHARE,
    blurb: "Galarian regional form, British-isles inspired styling.",
  },
  {
    value: "hisuian",
    label: "Hisuian",
    weight: OTHER_FORM_SHARE,
    blurb: "Hisuian regional form, ancient feudal-Japan inspired styling.",
  },
  {
    value: "paldean",
    label: "Paldean",
    weight: OTHER_FORM_SHARE,
    blurb: "Paldean regional form, Iberian-inspired styling.",
  },
  {
    value: "serialized",
    label: "Serialized",
    weight: OTHER_FORM_SHARE,
    blurb: "A serial-numbered limited print, individually numbered out of a fixed print run.",
  },
  {
    value: "signature",
    label: "Signature",
    weight: OTHER_FORM_SHARE,
    blurb:
      "A signature edition - the artwork itself includes a small, elegant hand-written signature of the Pokemon's name, like an artist's autograph.",
  },
];

/** The four possible print runs a Serialized pull can come from, each equally likely. */
const SERIAL_MAX_OPTIONS = [10, 50, 100, 1000] as const;

function rollSerialNumber(): { max: number; number: number } {
  const max = SERIAL_MAX_OPTIONS[Math.floor(Math.random() * SERIAL_MAX_OPTIONS.length)];
  const number = 1 + Math.floor(Math.random() * max);
  return { max, number };
}

/**
 * "Serialized" can't have a fixed blurb like every other special form - the exact print number is
 * rolled per-pull (first the print run size out of {10, 50, 100, 1000}, each equally likely, then
 * a specific number within that run) and has to reach both the on-card label and the drafting
 * model. Every other value passes through unchanged.
 */
function resolveSpecialForm(form: WeightedOption<SpecialForm>): WeightedOption<SpecialForm> {
  if (form.value !== "serialized") return form;
  const { max, number } = rollSerialNumber();
  const padded = String(number).padStart(String(max).length, "0");
  return {
    ...form,
    label: `Serialized #${padded}/${max}`,
    blurb: `A serial-numbered limited print - individually numbered ${padded} of only ${max} ever made, the print number reads exactly "${padded}/${max}".`,
  };
}

/** How many Pokemon a given special form's illustration depicts. */
export function pokemonCountForSpecialForm(specialForm: SpecialForm): number {
  if (specialForm === "triple-tag-team") return 3;
  if (specialForm === "tag-team") return 2;
  return 1;
}

/**
 * Picks a special form, excluding Tag Team / Triple Tag Team when the Pokemon pool is too small
 * to guarantee that many distinct Pokemon (otherwise a pairing could roll the same Pokemon twice).
 */
export function pickSpecialForm(poolSize: number, exclude?: SpecialForm): WeightedOption<SpecialForm> {
  const candidates = SPECIAL_FORMS.filter((f) => poolSize >= pokemonCountForSpecialForm(f.value));
  return resolveSpecialForm(pickWeighted(candidates, exclude));
}

// The creative concept the illustration is built around - all 69 equally likely (weight ~1.449
// each, summing to ~100 like the other tables). Mostly moods, but some are scenarios, genres or
// materials; the system prompt lets any of them drive the setting and action, not just the light. Unlike Special Form there's no "none"/default
// entry: every card always gets one of these vibes.
export const VIBES: WeightedOption<Vibe>[] = [
  { value: "cozy", label: "Cozy", weight: 1.4493, blurb: "Warm, soft, inviting atmosphere with gentle candlelit glow." },
  { value: "menacing", label: "Menacing", weight: 1.4493, blurb: "Dark, threatening mood with harsh shadows and a looming presence." },
  { value: "serene", label: "Serene", weight: 1.4493, blurb: "Calm, peaceful stillness bathed in soft, even light." },
  { value: "chaotic", label: "Chaotic", weight: 1.4493, blurb: "Wild, frenzied energy with clashing motion and scattered debris." },
  { value: "majestic", label: "Majestic", weight: 1.4493, blurb: "Grand, regal, awe-inspiring scale with sweeping composition." },
  { value: "playful", label: "Playful", weight: 1.4493, blurb: "Lighthearted, whimsical energy with bouncy motion and bright colors." },
  { value: "melancholic", label: "Melancholic", weight: 1.4493, blurb: "Wistful, bittersweet mood with muted tones and quiet stillness." },
  { value: "triumphant", label: "Triumphant", weight: 1.4493, blurb: "Victorious, heroic mood bathed in radiant golden light." },
  { value: "mysterious", label: "Mysterious", weight: 1.4493, blurb: "Shadowy, enigmatic atmosphere with secrets half-hidden in fog." },
  { value: "electric", label: "Electric", weight: 1.4493, blurb: "Crackling high-voltage energy with vivid neon-tinged light." },
  { value: "dreamy", label: "Dreamy", weight: 1.4493, blurb: "Hazy, surreal atmosphere with soft pastel colors and floating light." },
  { value: "fierce", label: "Fierce", weight: 1.4493, blurb: "Aggressive, powerful, primal intensity with a raw, feral edge." },
  { value: "nostalgic", label: "Nostalgic", weight: 1.4493, blurb: "Warm, sun-faded mood evoking a cherished half-remembered afternoon." },
  { value: "ethereal", label: "Ethereal", weight: 1.4493, blurb: "Otherworldly, glowing atmosphere with soft celestial light." },
  { value: "rebellious", label: "Rebellious", weight: 1.4493, blurb: "Edgy, defiant energy with bold contrast and gritty attitude." },
  { value: "wholesome", label: "Wholesome", weight: 1.4493, blurb: "Warm-hearted, friendly mood under bright, cheerful sunlight." },
  { value: "ominous", label: "Ominous", weight: 1.4493, blurb: "Foreboding atmosphere with heavy storm clouds and building dread." },
  { value: "vibrant", label: "Vibrant", weight: 1.4493, blurb: "Explosively colorful, high-energy mood with bold saturated hues." },
  { value: "tranquil", label: "Tranquil", weight: 1.4493, blurb: "Still, gentle, zen-like calm with soft natural light." },
  { value: "epic", label: "Epic", weight: 1.4493, blurb: "Cinematic, larger-than-life mood with sweeping dramatic scale." },
  { value: "regal", label: "Regal", weight: 1.4493, blurb: "Dignified, royal bearing with rich fabrics and ornate golden trim." },
  { value: "whimsical", label: "Whimsical", weight: 1.4493, blurb: "Fantastical storybook wonder with quirky, curious little details." },
  { value: "haunting", label: "Haunting", weight: 1.4493, blurb: "Eerie, ghostly atmosphere with a lingering, unshakeable unease." },
  { value: "radiant", label: "Radiant", weight: 1.4493, blurb: "Glowing, luminous warmth with brilliant light spilling outward." },
  { value: "stormy", label: "Stormy", weight: 1.4493, blurb: "Turbulent weather-driven intensity with lashing rain and wind." },
  { value: "intimate", label: "Intimate", weight: 1.4493, blurb: "Close, quiet, personal moment with soft, gentle warmth." },
  { value: "explosive", label: "Explosive", weight: 1.4493, blurb: "Sudden violent burst of raw energy and scattering force." },
  { value: "frosty", label: "Frosty", weight: 1.4493, blurb: "Icy, crisp atmosphere with pale light and drifting frost." },
  { value: "sultry", label: "Sultry", weight: 1.4493, blurb: "Smoldering, heat-heavy mood with deep, saturated warm tones." },
  { value: "solemn", label: "Solemn", weight: 1.4493, blurb: "Grave, ceremonial hush with muted light and still composure." },
  { value: "curious", label: "Curious", weight: 1.4493, blurb: "Inquisitive, exploratory energy with wide-eyed wonder." },
  { value: "celestial", label: "Celestial", weight: 1.4493, blurb: "Starry, cosmic atmosphere bathed in heavenly light." },
  { value: "industrial", label: "Industrial", weight: 1.4493, blurb: "Gritty mechanical setting with hard metal edges and harsh work light." },
  { value: "enchanted", label: "Enchanted", weight: 1.4493, blurb: "Spellbound, magical fairy-tale mood with glimmering motes of light." },
  { value: "desolate", label: "Desolate", weight: 1.4493, blurb: "Barren, abandoned atmosphere with a forlorn, wind-swept emptiness." },
  { value: "jubilant", label: "Jubilant", weight: 1.4493, blurb: "Joyous, celebratory energy bursting with color and motion." },
  { value: "brooding", label: "Brooding", weight: 1.4493, blurb: "Dark, introspective tension with heavy shadow and simmering intensity." },
  { value: "surreal", label: "Surreal", weight: 1.4493, blurb: "Bizarre, dreamlike logic with impossible, reality-bending imagery." },
  { value: "vengeful", label: "Vengeful", weight: 1.4493, blurb: "Wrathful, retributive intensity with burning eyes and coiled fury." },
  { value: "glorious", label: "Glorious", weight: 1.4493, blurb: "Exalted, magnificent splendor bathed in triumphant golden light." },
  { value: "feverish", label: "Feverish", weight: 1.4493, blurb: "Restless, hallucinatory heat with shimmering distorted light and fevered unease." },
  { value: "reverent", label: "Reverent", weight: 1.4493, blurb: "Hushed, worshipful awe bathed in soft sacred light filtering through stillness." },
  { value: "vigilant", label: "Vigilant", weight: 1.4493, blurb: "Alert, tense watchfulness with sharp shadows and a sentinel's unblinking focus." },
  { value: "opulent", label: "Opulent", weight: 1.4493, blurb: "Lavish, gilded luxury dripping with rich fabrics and glittering excess." },
  { value: "delirious", label: "Delirious", weight: 1.4493, blurb: "Manic, overwhelming fever-dream disorientation with swirling warped colors." },
  { value: "zealous", label: "Zealous", weight: 1.4493, blurb: "Fervent, crusading passion blazing with unwavering righteous intensity." },
  { value: "feral", label: "Feral", weight: 1.4493, blurb: "Untamed animalistic wildness with bared instinct and a raw survivalist edge." },
  { value: "festive", label: "Festive", weight: 1.4493, blurb: "Bright holiday cheer strung with decorations and a warm celebratory glow." },
  { value: "primeval", label: "Primeval", weight: 1.4493, blurb: "Ancient, untouched wilderness steeped in raw prehistoric stillness." },
  { value: "austere", label: "Austere", weight: 1.4493, blurb: "Stark, minimalist severity with clean hard lines and unadorned restraint." },
  { value: "macabre", label: "Macabre", weight: 1.4493, blurb: "Grim, darkly theatrical mood with morbid flourishes and gallows charm." },
  { value: "buoyant", label: "Buoyant", weight: 1.4493, blurb: "Light, effervescent uplift with airy motion and bright bubbling cheer." },
  { value: "volcanic", label: "Volcanic", weight: 1.4493, blurb: "Eruptive magma-hot violence with molten glow and cracking pressure." },
  { value: "resolute", label: "Resolute", weight: 1.4493, blurb: "Steadfast, unwavering determination with a hard-set gaze and quiet composure." },
  { value: "chivalrous", label: "Chivalrous", weight: 1.4493, blurb: "Noble, honor-bound valor with knightly bearing and gallant poise." },
  { value: "voracious", label: "Voracious", weight: 1.4493, blurb: "Ravenous, consuming hunger with a predatory gleam and insatiable drive." },
  { value: "exaggerated", label: "Exaggerated", weight: 1.4493, blurb: "Cartoonishly exaggerated proportions and expressions, bursting with over-the-top comic energy." },
  { value: "humongous", label: "Humongous", weight: 1.4493, blurb: "Colossal, larger-than-life scale with a monumental, towering presence." },
  { value: "secret", label: "Secret", weight: 1.4493, blurb: "Hidden, veiled secrecy shrouded in shadow and quiet, hushed concealment." },
  { value: "sports-promo", label: "Sports Promo", weight: 1.4493, blurb: "Glossy holographic sports-trading-card energy with a dynamic action shot and bold promo shine." },
  { value: "one-piece", label: "One Piece", weight: 1.4493, blurb: "Swashbuckling high-seas pirate adventure with windswept bravado and bold shonen-anime energy." },
  { value: "statue", label: "Statue", weight: 1.4493, blurb: "Carved as a weathered stone monument, frozen mid-pose on a plinth with moss in the chisel marks." },
  { value: "sus", label: "Sus", weight: 1.4493, blurb: "Shifty impostor energy - narrowed sidelong eyes, a vent left suspiciously ajar, and the dawning certainty that one of them absolutely did it." },
  { value: "football", label: "Football", weight: 1.4493, blurb: "Floodlit stadium night: a packed roaring terrace, churned turf underfoot, and the ball struck mid-air in an impossible acrobatic strike." },
  { value: "slimy", label: "Slimy", weight: 1.4493, blurb: "Drenched in thick glistening ooze, translucent strands stretching and dripping off every surface with a wet iridescent sheen." },
  { value: "attack-on-titan", label: "Attack on Titan", weight: 1.4493, blurb: "Grim colossal-titan scale against towering walls, desperate figures swinging on grappling gear through a bleak muted sky." },
  { value: "league-of-legends", label: "League of Legends", weight: 1.4493, blurb: "Epic champion splash-art key art - heroic fantasy armor, a signature ability erupting in dramatic magical VFX, painted with cinematic bombast." },
  { value: "poop", label: "Poop", weight: 1.4493, blurb: "Unashamed cartoon-turd comedy: glossy brown swirl-topped coils, wobbling stink lines, and a couple of delighted circling flies." },
  { value: "magical-poop-world", label: "Magical Poop World", weight: 1.4493, blurb: "An enchanted realm sculpted entirely from glittering swirl-peaked turds - candy-bright dung mountains, rainbow sparkles and a wondrous fairytale glow over it all." },
];
