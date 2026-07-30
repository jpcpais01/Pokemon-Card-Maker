import type { Generation, PokemonRef } from "./types";

export const GENERATIONS: Generation[] = [
  { id: 1, roman: "I", label: "Gen I", region: "Kanto" },
  { id: 2, roman: "II", label: "Gen II", region: "Johto" },
  { id: 3, roman: "III", label: "Gen III", region: "Hoenn" },
  { id: 4, roman: "IV", label: "Gen IV", region: "Sinnoh" },
  { id: 5, roman: "V", label: "Gen V", region: "Unova" },
  { id: 6, roman: "VI", label: "Gen VI", region: "Kalos" },
  { id: 7, roman: "VII", label: "Gen VII", region: "Alola" },
  { id: 8, roman: "VIII", label: "Gen VIII", region: "Galar" },
  { id: 9, roman: "IX", label: "Gen IX", region: "Paldea" },
];

const genCache = new Map<number, Promise<PokemonRef[]>>();

/** A handful of species whose kebab-case PokeAPI name doesn't title-case cleanly. */
const NAME_OVERRIDES: Record<string, string> = {
  "mr-mime": "Mr. Mime",
  "mr-rime": "Mr. Rime",
  "mime-jr": "Mime Jr.",
  "ho-oh": "Ho-Oh",
  "porygon-z": "Porygon-Z",
  "jangmo-o": "Jangmo-o",
  "hakamo-o": "Hakamo-o",
  "kommo-o": "Kommo-o",
  "nidoran-f": "Nidoran ♀",
  "nidoran-m": "Nidoran ♂",
  "farfetchd": "Farfetch'd",
  "sirfetchd": "Sirfetch'd",
  "type-null": "Type: Null",
  "tapu-koko": "Tapu Koko",
  "tapu-lele": "Tapu Lele",
  "tapu-bulu": "Tapu Bulu",
  "tapu-fini": "Tapu Fini",
  flabebe: "Flabébé",
};

export function prettifyPokemonName(name: string): string {
  if (NAME_OVERRIDES[name]) return NAME_OVERRIDES[name];
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function officialArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function speciesIdFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
}

async function fetchGeneration(genId: number): Promise<PokemonRef[]> {
  const res = await fetch(`https://pokeapi.co/api/v2/generation/${genId}`);
  if (!res.ok) throw new Error(`Failed to load generation ${genId}`);
  const data = await res.json();
  return (data.pokemon_species as { name: string; url: string }[]).map((s) => ({
    id: speciesIdFromUrl(s.url),
    name: s.name,
  }));
}

/** Fetches (and caches) the full species list for the given generations, no manual data entry required. */
export async function fetchPokemonForGenerations(genIds: number[]): Promise<PokemonRef[]> {
  const lists = await Promise.all(
    genIds.map((id) => {
      if (!genCache.has(id)) genCache.set(id, fetchGeneration(id));
      return genCache.get(id)!;
    })
  );
  const seen = new Set<number>();
  const combined: PokemonRef[] = [];
  for (const list of lists) {
    for (const p of list) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        combined.push(p);
      }
    }
  }
  return combined.sort((a, b) => a.id - b.id);
}

export function pickRandomPokemon(pool: PokemonRef[], exclude: number[] = []): PokemonRef {
  const available = pool.filter((p) => !exclude.includes(p.id));
  const candidates = available.length > 0 ? available : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
