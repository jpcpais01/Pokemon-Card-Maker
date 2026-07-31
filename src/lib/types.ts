export type ArtType = "ex" | "illustration-rare" | "special-illustration-rare";

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
  pokemons: PokemonPick[];
}
