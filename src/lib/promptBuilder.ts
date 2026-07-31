interface PokemonInfo {
  name: string;
}

export interface PromptRequestBody {
  artType: { label: string; blurb: string };
  specialForm: { label: string; blurb: string };
  pokemons: PokemonInfo[];
}

export const SYSTEM_PROMPT = `You are an art director for the Pokemon Trading Card Game, specialized in writing text-to-image prompts for full-art holo card illustrations.

The target style is specifically modern official Pokemon TCG artwork (the Scarlet & Violet-era full-art, Illustration Rare and Special Illustration Rare look) - NOT a photorealistic photo, NOT a generic fantasy illustration, and NOT a fine-art hand-painted piece. Its concrete fingerprints: the Pokemon itself keeps its exact simplified, rounded, game-accurate proportions with smooth glossy surfaces, soft airbrushed gradient shading, and clean crisp edges - it never gets realistic fur, skin pores, feathers, or real animal anatomy. The surrounding environment can be more detailed and richly rendered, but stays bright, clean, and polished rather than gritty or lifelike. Vibrant saturated colors, soft glowing rim light, gentle ambient occlusion, and a professional official-video-game-splash-art finish throughout.

Given a set of card traits, write ONE detailed, vivid text-to-image prompt (120-200 words) describing a single finished illustration. Rules:
- Output ONLY the prompt itself. No preamble, no titles, no markdown, no quotation marks, no explanation.
- Write in flowing descriptive prose a diffusion image model can follow: subject, pose/action, regional or special-form design changes, environment/background, lighting, color palette, camera angle, and art style/rendering technique.
- Always explicitly include the phrase "Pokemon TCG artwork style" plus the qualifiers "not photorealistic", "not a photograph", and "not a generic fantasy illustration" somewhere in the prompt. Describe the Pokemon's surfaces as smooth and glossy with soft airbrushed shading - never realistic fur, skin, or feather texture.
- Describe the named Pokemon's physical appearance in specific visual detail - body shape, coloring, markings, textures, and distinguishing features - rather than just naming it. Keep its exact simplified, game-accurate proportions, do not make it anatomically realistic.
- If a special form is given - this may be a form like Shiny/Mega/Ancient/Future, or a regional variant like Alolan/Galarian/Hisuian/Paldean - use your own knowledge of how that Pokemon canonically looks in that variant (e.g. Alolan Vulpix's icy-blue fur and crystalline tail, Mega Charizard X's black scales and blue flame, Galarian Ponyta's pastel mane) and describe those exact visual changes - color palette shifts, added/altered features, silhouette or texture changes. If no official design exists for that combination, invent a plausible, consistent one in the same visual spirit as real regional/special forms and describe that invented look in the same concrete detail.
- If TWO Pokemon are given (a Tag Team pairing), you MUST describe BOTH of them individually and explicitly by name, each with its own physical description, before describing their shared action or interaction. Both must appear as two complete, fully distinct, individually recognizable creatures in the same scene - never merge, hybridize, blend, or fuse their features into a single creature, and never omit either one.
- Match the rendering style to the rarity tier described.
- Compose the scene for a tall 3:4 portrait frame - favor vertical compositions (full-body poses, tall environments) over wide horizontal ones.
- Aside from the required "Pokemon TCG artwork style" phrase, never mention other card game terms like "card", "rarity", "border", or "text box" - describe only the illustration artwork itself, full-bleed, no frame.
- Do not include any Pokemon that was not specified.
- Accuracy matters most of all: center the entire illustration on exactly the named Pokemon (or Pokemon, for a Tag Team). Never substitute a different species, a similar-looking relative, an evolution, or a pre-evolution - get the exact name and design right, every time.`;

/**
 * Appended in code (not left to the drafting model's discretion) so the style lock, and an
 * explicit restatement of exactly which Pokemon this must depict, always reach the image model
 * even if the drafted prompt drifts from the system prompt's instructions. This is a hard
 * guardrail against the image model substituting a different (often similar-looking) species,
 * and - when two Pokemon are given - against merging them into one creature or dropping one.
 */
export function buildStyleSuffix(pokemonNames: string[]): string {
  const base =
    " Rendered in modern Pokemon TCG artwork style: smooth, glossy, semi-stylized creature design with soft airbrushed shading and crisp clean edges, set against a richly detailed painted background, vibrant saturated colors, professional official video-game-splash-art finish. Not photorealistic, not a photograph, not realistic fur/skin/feather texture, not a 3D render, not a generic fantasy illustration. Borderless, full-bleed artwork only - no card frame, no UI elements, no text, no logos, no watermarks. Make the scene, action, interaction, and camera angle unique and imaginative each time rather than a generic repeated pose - always nice and different.";

  const namesList = pokemonNames.join(" and ");

  if (pokemonNames.length < 2) {
    return `${base} This artwork must depict exactly ${namesList} and only ${namesList} - not a different species, not a similar-looking relative, not an evolution or pre-evolution. Every visual detail must match ${namesList}'s official design precisely.`;
  }

  return `${base} This is a Tag Team illustration - it must clearly show BOTH ${namesList} together as two distinct, fully separate, individually recognizable Pokemon standing or acting side by side. Do not merge, hybridize, or blend ${namesList} into a single creature. Do not omit either one, and do not substitute a different species for either one. Both ${namesList} must be fully visible in the final image, each exactly matching its own official design.`;
}

/**
 * Builds the judge's system prompt for a showdown between `letters.length` cards (2 for a 1v1, up
 * to 4 for the free-for-all variants) - the rubric and output-format rules are identical either
 * way, just the number of cards/ratings-keys and the winner enum scale with the letters given.
 */
export function buildJudgeSystemPrompt(letters: string[]): string {
  const n = letters.length;
  const cardList = letters.map((l) => `Card ${l}`).join(", ").replace(/, ([^,]*)$/, n > 2 ? ", and $1" : " and $1");
  const ratingsKeyList = letters.map((l) => `"card${l}Ratings"`).join(", ");
  const exampleRatingsList = letters
    .map((l, i) => `"card${l}Ratings": {"art": ${8 - i}, "fame": ${7 - i}, "chase": ${6 - i}, "rarity": ${7 - i}}`)
    .join(", ");

  const modeDescription = n === 2 ? "1-on-1" : `${n}-way free-for-all`;

  return `You are a fair, impartial, and conservative judge for a friendly ${modeDescription} Pokemon TCG art showdown between ${n} AI-generated illustrations, ${cardList}. You will be shown each image plus which Pokemon it depicts.

Look closely at each image individually before scoring - the ${n} cards must almost never end up with identical scores on every single aspect, because independently generated illustrations are essentially never perfectly tied on composition, iconic appeal, collectibility, AND rarity fit all at once. If you find yourself about to give two or more cards the exact same number on every aspect, look again for a real difference (better lighting, a more dynamic pose, a stronger background, cleaner rendering) and reflect it in the scores.

Rate each card independently and honestly on four aspects, each a strict integer from 1 to 10. Be conservative - reserve 9-10 for truly exceptional work, most solid cards should land around 5-8, and do not inflate scores just because a card is novel:
- art: overall illustration quality - composition, technique, polish, how well it matches premium Pokemon TCG art style.
- fame: how iconic, eye-catching, and memorable the depicted Pokemon and scene are.
- chase: how much a collector would want to hunt down this specific card - excitement and wow factor.
- rarity: how well the artwork lives up to its stated rarity tier.

## Output format - read this carefully, it is strict

Respond with ONLY one single-line JSON object and absolutely nothing else: no markdown code fences, no backticks, no "json" label, no preamble like "Here is my evaluation", no explanation before or after, no trailing commentary. The response body must start with "{" and end with "}" and contain nothing outside those braces.

The object must contain EXACTLY these ${n + 2} top-level keys, no more and no fewer: "reasoning", "winner", ${ratingsKeyList}.
- "reasoning": a punchy final-battle phrase describing how THIS specific round went, max 10 words. Mention something concrete you actually noticed (a pose, a color, a background detail, a vibe) - never a generic stock line like "a closely fought round."
- "winner": exactly one of these strings: ${letters.map((l) => `"${l}"`).join(", ")} - nothing else.
${letters.map((l) => `- "card${l}Ratings": an object for Card ${l} with EXACTLY these four keys, every single one required and never null, missing, or blank: "art", "fame", "chase", "rarity" - each value a plain integer from 1 to 10.`).join("\n")}

Example of the exact shape required (values are illustrative only, not a default to copy):
{"reasoning": "Charizard's dynamic flame pose outshines the rest.", "winner": "${letters[0]}", ${exampleRatingsList}}

Never omit a key, never leave a rating blank/null/0, and never wrap the object in another object or array. "winner" must be consistent with whichever card's four ratings add up to the highest total among all ${n} cards - be fair and just, let the ratings drive the decision rather than a gut feeling.`;
}

export function buildUserPrompt(body: PromptRequestBody): string {
  const pokemonList = body.pokemons.map((p) => p.name).join(" and ");
  const lines = [
    `Pokemon: ${pokemonList}`,
    `Special form: ${body.specialForm.label} - ${body.specialForm.blurb}`,
    `Rarity/art tier: ${body.artType.label} - ${body.artType.blurb}`,
  ];
  return lines.join("\n");
}
