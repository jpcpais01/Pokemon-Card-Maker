export type ArtType = "ex" | "illustration-rare" | "special-illustration-rare";

// The mood/atmosphere the artwork gets rendered in - always exactly one of these 20, all equally
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
  | "epic";

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
