import type { Generation, PokemonPick, PokemonRef } from "./types";

/** Not a real generation - a curated pool of ~100 iconic/fan-favorite Pokemon spanning every generation. */
export const TOP_100_GEN_ID = 0;

export const GENERATIONS: Generation[] = [
  { id: 1, label: "Gen I", region: "Kanto" },
  { id: 2, label: "Gen II", region: "Johto" },
  { id: 3, label: "Gen III", region: "Hoenn" },
  { id: 4, label: "Gen IV", region: "Sinnoh" },
  { id: 5, label: "Gen V", region: "Unova" },
  { id: 6, label: "Gen VI", region: "Kalos" },
  { id: 7, label: "Gen VII", region: "Alola" },
  { id: 8, label: "Gen VIII", region: "Galar" },
  { id: 9, label: "Gen IX", region: "Paldea" },
  { id: TOP_100_GEN_ID, label: "Best 100", region: "Fan Favorites" },
];

/**
 * A hand-picked pool of ~100 iconic, popular, and fan-favorite Pokemon spanning every generation
 * released so far - selected directly (not fetched) since it isn't a real PokeAPI generation.
 */
const TOP_100_SPECIES: PokemonRef[] = [
  // Gen I
  { id: 25, name: "pikachu" },
  { id: 6, name: "charizard" },
  { id: 150, name: "mewtwo" },
  { id: 151, name: "mew" },
  { id: 130, name: "gyarados" },
  { id: 143, name: "snorlax" },
  { id: 133, name: "eevee" },
  { id: 94, name: "gengar" },
  { id: 149, name: "dragonite" },
  { id: 9, name: "blastoise" },
  { id: 3, name: "venusaur" },
  { id: 65, name: "alakazam" },
  { id: 26, name: "raichu" },
  { id: 39, name: "jigglypuff" },
  // Gen II
  { id: 249, name: "lugia" },
  { id: 250, name: "ho-oh" },
  { id: 157, name: "typhlosion" },
  { id: 160, name: "feraligatr" },
  { id: 197, name: "umbreon" },
  { id: 196, name: "espeon" },
  { id: 248, name: "tyranitar" },
  { id: 212, name: "scizor" },
  { id: 251, name: "celebi" },
  { id: 245, name: "suicune" },
  { id: 181, name: "ampharos" },
  // Gen III
  { id: 384, name: "rayquaza" },
  { id: 383, name: "groudon" },
  { id: 382, name: "kyogre" },
  { id: 257, name: "blaziken" },
  { id: 260, name: "swampert" },
  { id: 254, name: "sceptile" },
  { id: 282, name: "gardevoir" },
  { id: 373, name: "salamence" },
  { id: 376, name: "metagross" },
  { id: 359, name: "absol" },
  { id: 330, name: "flygon" },
  // Gen IV
  { id: 445, name: "garchomp" },
  { id: 448, name: "lucario" },
  { id: 483, name: "dialga" },
  { id: 484, name: "palkia" },
  { id: 487, name: "giratina" },
  { id: 491, name: "darkrai" },
  { id: 493, name: "arceus" },
  { id: 392, name: "infernape" },
  { id: 395, name: "empoleon" },
  { id: 461, name: "weavile" },
  { id: 468, name: "togekiss" },
  // Gen V
  { id: 571, name: "zoroark" },
  { id: 644, name: "zekrom" },
  { id: 643, name: "reshiram" },
  { id: 646, name: "kyurem" },
  { id: 497, name: "serperior" },
  { id: 500, name: "emboar" },
  { id: 503, name: "samurott" },
  { id: 609, name: "chandelure" },
  { id: 612, name: "haxorus" },
  { id: 637, name: "volcarona" },
  { id: 635, name: "hydreigon" },
  // Gen VI
  { id: 658, name: "greninja" },
  { id: 663, name: "talonflame" },
  { id: 700, name: "sylveon" },
  { id: 681, name: "aegislash" },
  { id: 716, name: "xerneas" },
  { id: 717, name: "yveltal" },
  { id: 718, name: "zygarde" },
  { id: 706, name: "goodra" },
  { id: 709, name: "trevenant" },
  // Gen VII
  { id: 724, name: "decidueye" },
  { id: 727, name: "incineroar" },
  { id: 730, name: "primarina" },
  { id: 745, name: "lycanroc" },
  { id: 778, name: "mimikyu" },
  { id: 748, name: "toxapex" },
  { id: 784, name: "kommo-o" },
  { id: 800, name: "necrozma" },
  { id: 792, name: "lunala" },
  { id: 791, name: "solgaleo" },
  { id: 785, name: "tapu-koko" },
  // Gen VIII
  { id: 887, name: "dragapult" },
  { id: 823, name: "corviknight" },
  { id: 849, name: "toxtricity" },
  { id: 861, name: "grimmsnarl" },
  { id: 888, name: "zacian" },
  { id: 889, name: "zamazenta" },
  { id: 890, name: "eternatus" },
  { id: 892, name: "urshifu" },
  { id: 815, name: "cinderace" },
  { id: 812, name: "rillaboom" },
  { id: 818, name: "inteleon" },
  // Gen IX
  { id: 1008, name: "miraidon" },
  { id: 1007, name: "koraidon" },
  { id: 911, name: "skeledirge" },
  { id: 908, name: "meowscarada" },
  { id: 914, name: "quaquaval" },
  { id: 998, name: "baxcalibur" },
  { id: 1000, name: "gholdengo" },
  { id: 1006, name: "iron-valiant" },
  { id: 1005, name: "roaring-moon" },
  { id: 937, name: "ceruledge" },
  { id: 936, name: "armarouge" },
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
  if (genId === TOP_100_GEN_ID) return TOP_100_SPECIES;
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

export function toPokemonPick(p: PokemonRef): PokemonPick {
  return {
    id: p.id,
    name: p.name,
    displayName: prettifyPokemonName(p.name),
    artworkUrl: officialArtworkUrl(p.id),
  };
}
