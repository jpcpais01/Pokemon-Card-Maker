import type { Generation, PokemonPick, PokemonRef } from "./types";

/** Not a real generation - a curated pool of ~100 iconic/fan-favorite Pokemon spanning every generation. */
export const TOP_100_GEN_ID = 0;
/** Not a real generation - a curated pool of Pokemon fan communities commonly consider attractive/alluring. */
export const BADDIES_GEN_ID = -1;
/** Not a real generation - a curated pool of underrated, weird, or design-forward Pokemon that rarely get the spotlight. */
export const NICHE_GEN_ID = -2;
/** Not a real generation - a curated pool of water/beach/summer Pokemon for the Pool Party event. */
export const POOL_PARTY_GEN_ID = -3;

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
  { id: BADDIES_GEN_ID, label: "Baddies", region: "Iconic & Alluring" },
  { id: NICHE_GEN_ID, label: "Niche", region: "Hidden Gems" },
  { id: POOL_PARTY_GEN_ID, label: "Pool Party", region: "Beach & Summer" },
];

/** True only when Baddies is the sole selected generation, not just one of several. */
export function isBaddiesOnlySelection(gens: number[]): boolean {
  return gens.length === 1 && gens[0] === BADDIES_GEN_ID;
}

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

/** Not fetched from PokeAPI - a hand-picked pool of Pokemon fan communities commonly consider
 *  conventionally attractive/alluring, spanning as many generations as possible. */
const BADDIES_SPECIES: PokemonRef[] = [
  { id: 282, name: "gardevoir" },
  { id: 475, name: "gallade" },
  { id: 350, name: "milotic" },
  { id: 758, name: "salazzle" },
  { id: 428, name: "lopunny" },
  { id: 654, name: "braixen" },
  { id: 655, name: "delphox" },
  { id: 549, name: "lilligant" },
  { id: 497, name: "serperior" },
  { id: 571, name: "zoroark" },
  { id: 576, name: "gothitelle" },
  { id: 700, name: "sylveon" },
  { id: 196, name: "espeon" },
  { id: 197, name: "umbreon" },
  { id: 471, name: "glaceon" },
  { id: 38, name: "ninetales" },
  { id: 78, name: "rapidash" },
  { id: 671, name: "florges" },
  { id: 407, name: "roserade" },
  { id: 763, name: "tsareena" },
  { id: 730, name: "primarina" },
  { id: 727, name: "incineroar" },
  { id: 815, name: "cinderace" },
  { id: 908, name: "meowscarada" },
  { id: 911, name: "skeledirge" },
  { id: 914, name: "quaquaval" },
  { id: 478, name: "froslass" },
  { id: 429, name: "mismagius" },
  { id: 510, name: "liepard" },
  { id: 658, name: "greninja" },
  { id: 807, name: "zeraora" },
  { id: 448, name: "lucario" },
  { id: 380, name: "latias" },
  { id: 381, name: "latios" },
  { id: 461, name: "weavile" },
  { id: 359, name: "absol" },
  { id: 876, name: "indeedee" },
  { id: 818, name: "inteleon" },
  { id: 182, name: "bellossom" },
  { id: 257, name: "blaziken" },
];

/** Not fetched from PokeAPI - a hand-picked pool of underrated, weird-but-cool, design-forward
 *  Pokemon that don't usually get much attention, spanning as many generations as possible. */
const NICHE_SPECIES: PokemonRef[] = [
  { id: 437, name: "bronzong" },
  { id: 561, name: "sigilyph" },
  { id: 563, name: "cofagrigus" },
  { id: 618, name: "stunfisk" },
  { id: 623, name: "golurk" },
  { id: 707, name: "klefki" },
  { id: 740, name: "crabominable" },
  { id: 741, name: "oricorio" },
  { id: 743, name: "ribombee" },
  { id: 746, name: "wishiwashi" },
  { id: 747, name: "mareanie" },
  { id: 750, name: "mudsdale" },
  { id: 752, name: "araquanid" },
  { id: 756, name: "shiinotic" },
  { id: 760, name: "bewear" },
  { id: 764, name: "comfey" },
  { id: 765, name: "oranguru" },
  { id: 766, name: "passimian" },
  { id: 768, name: "golisopod" },
  { id: 770, name: "palossand" },
  { id: 771, name: "pyukumuku" },
  { id: 772, name: "type-null" },
  { id: 773, name: "silvally" },
  { id: 775, name: "komala" },
  { id: 776, name: "turtonator" },
  { id: 779, name: "bruxish" },
  { id: 780, name: "drampa" },
  { id: 781, name: "dhelmise" },
  { id: 793, name: "nihilego" },
  { id: 795, name: "pheromosa" },
  { id: 796, name: "xurkitree" },
  { id: 797, name: "celesteela" },
  { id: 798, name: "kartana" },
  { id: 799, name: "guzzlord" },
  { id: 803, name: "poipole" },
  { id: 804, name: "naganadel" },
  { id: 805, name: "stakataka" },
  { id: 806, name: "blacephalon" },
  { id: 738, name: "vikavolt" },
];

/** Not fetched from PokeAPI - a hand-picked pool of water, beach and summer Pokemon for the
 *  Pool Party event: the ones that actually look at home in a pool, on a float, or on the sand. */
const POOL_PARTY_SPECIES: PokemonRef[] = [
  { id: 7, name: "squirtle" },
  { id: 9, name: "blastoise" },
  { id: 54, name: "psyduck" },
  { id: 55, name: "golduck" },
  { id: 61, name: "poliwhirl" },
  { id: 79, name: "slowpoke" },
  { id: 86, name: "seel" },
  { id: 87, name: "dewgong" },
  { id: 98, name: "krabby" },
  { id: 99, name: "kingler" },
  { id: 116, name: "horsea" },
  { id: 118, name: "goldeen" },
  { id: 120, name: "staryu" },
  { id: 121, name: "starmie" },
  { id: 131, name: "lapras" },
  { id: 134, name: "vaporeon" },
  { id: 158, name: "totodile" },
  { id: 183, name: "marill" },
  { id: 184, name: "azumarill" },
  { id: 194, name: "wooper" },
  { id: 195, name: "quagsire" },
  { id: 222, name: "corsola" },
  { id: 226, name: "mantine" },
  { id: 258, name: "mudkip" },
  { id: 260, name: "swampert" },
  { id: 270, name: "lotad" },
  { id: 272, name: "ludicolo" },
  { id: 278, name: "wingull" },
  { id: 279, name: "pelipper" },
  { id: 320, name: "wailmer" },
  { id: 341, name: "corphish" },
  { id: 350, name: "milotic" },
  { id: 363, name: "spheal" },
  { id: 393, name: "piplup" },
  { id: 395, name: "empoleon" },
  { id: 418, name: "buizel" },
  { id: 419, name: "floatzel" },
  { id: 456, name: "finneon" },
  { id: 501, name: "oshawott" },
  { id: 594, name: "alomomola" },
  { id: 656, name: "froakie" },
  { id: 658, name: "greninja" },
  { id: 728, name: "popplio" },
  { id: 730, name: "primarina" },
  { id: 816, name: "sobble" },
  { id: 818, name: "inteleon" },
  { id: 912, name: "quaxly" },
  { id: 914, name: "quaquaval" },
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
  if (genId === BADDIES_GEN_ID) return BADDIES_SPECIES;
  if (genId === NICHE_GEN_ID) return NICHE_SPECIES;
  if (genId === POOL_PARTY_GEN_ID) return POOL_PARTY_SPECIES;
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
