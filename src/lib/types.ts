export type ArtType = "ex" | "illustration-rare" | "special-illustration-rare";

export type SpecialForm =
  | "none"
  | "shiny"
  | "mega"
  | "gold-star"
  | "tag-team"
  | "ancient"
  | "future"
  | "delta-species";

export type Region = "default" | "alolan" | "galarian" | "hisuian" | "paldean";

export interface WeightedOption<T extends string> {
  value: T;
  label: string;
  weight: number;
  /** Short flavor text shown on the revealed card + sent to the prompt model. */
  blurb: string;
}

export interface Generation {
  id: number;
  roman: string;
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
  region: WeightedOption<Region>;
  pokemons: PokemonPick[];
}
