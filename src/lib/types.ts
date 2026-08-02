export type ArtType = "ex" | "illustration-rare" | "special-illustration-rare";

// Forces every card's artType ("sir"), specialForm ("tagteam"), or both ("tagteamsir") for a
// whole pack-opening session or battle match; "classic" (the default) leaves both random.
export type PackMode = "classic" | "sir" | "tagteam" | "tagteamsir";

// The mood/atmosphere the artwork gets rendered in - always exactly one of these 61, all equally
// likely; unlike Special Form there is no "none"/default outcome.
export type Vibe =
  | "cozy"
  | "menacing"
  | "serene"
  | "chaotic"
  | "majestic"
  | "playful"
  | "melancholic"
  | "triumphant"
  | "mysterious"
  | "electric"
  | "dreamy"
  | "fierce"
  | "nostalgic"
  | "ethereal"
  | "rebellious"
  | "wholesome"
  | "ominous"
  | "vibrant"
  | "tranquil"
  | "epic"
  | "regal"
  | "whimsical"
  | "haunting"
  | "radiant"
  | "stormy"
  | "intimate"
  | "explosive"
  | "frosty"
  | "sultry"
  | "solemn"
  | "curious"
  | "celestial"
  | "industrial"
  | "enchanted"
  | "desolate"
  | "jubilant"
  | "brooding"
  | "surreal"
  | "vengeful"
  | "glorious"
  | "feverish"
  | "reverent"
  | "vigilant"
  | "opulent"
  | "delirious"
  | "zealous"
  | "feral"
  | "festive"
  | "primeval"
  | "austere"
  | "macabre"
  | "buoyant"
  | "volcanic"
  | "resolute"
  | "chivalrous"
  | "voracious"
  | "exaggerated"
  | "humongous"
  | "secret"
  | "sports-promo"
  | "one-piece";

// A single combined pool: special forms (Shiny, Mega, Tag Team, ...) and regional forms
// (Alolan, Galarian, ...) are mutually exclusive outcomes of the same roll/card, not two
// independent traits.
export type SpecialForm =
  | "none"
  | "shiny"
  | "mega"
  | "gold-star"
  | "tag-team"
  | "ancient"
  | "future"
  | "delta-species"
  | "alolan"
  | "galarian"
  | "hisuian"
  | "paldean";

export interface WeightedOption<T extends string> {
  value: T;
  label: string;
  weight: number;
  /** Short flavor text shown on the revealed card + sent to the prompt model. */
  blurb: string;
}

export interface Generation {
  id: number;
  label: string;
  region: string;
}

export interface PokemonRef {
  id: number;
  name: string;
}

export interface PokemonPick extends PokemonRef {
  displayName: string;
  artworkUrl: string;
}

export interface CardSelections {
  generations: number[];
  artType: WeightedOption<ArtType>;
  specialForm: WeightedOption<SpecialForm>;
  vibe: WeightedOption<Vibe>;
  pokemons: PokemonPick[];
}
