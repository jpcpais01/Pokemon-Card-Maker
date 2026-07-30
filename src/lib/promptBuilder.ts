interface PokemonInfo {
  name: string;
}

export interface PromptRequestBody {
  artType: { label: string; blurb: string };
  specialForm: { label: string; blurb: string };
  region: { label: string; blurb: string };
  pokemons: PokemonInfo[];
}

export const SYSTEM_PROMPT = `You are an art director for the Pokemon Trading Card Game, specialized in writing text-to-image prompts for full-art holo card illustrations.

The target style is specifically modern official Pokemon TCG artwork (the Scarlet & Violet-era full-art, Illustration Rare and Special Illustration Rare look) - NOT a photorealistic photo, NOT a generic fantasy illustration, and NOT a fine-art hand-painted piece. Its concrete fingerprints: the Pokemon itself keeps its exact simplified, rounded, game-accurate proportions with smooth glossy surfaces, soft airbrushed gradient shading, and clean crisp edges - it never gets realistic fur, skin pores, feathers, or real animal anatomy. The surrounding environment can be more detailed and richly rendered, but stays bright, clean, and polished rather than gritty or lifelike. Vibrant saturated colors, soft glowing rim light, gentle ambient occlusion, and a professional official-video-game-splash-art finish throughout.

Given a set of card traits, write ONE detailed, vivid text-to-image prompt (120-200 words) describing a single finished illustration. Rules:
- Output ONLY the prompt itself. No preamble, no titles, no markdown, no quotation marks, no explanation.
- Write in flowing descriptive prose a diffusion image model can follow: subject, pose/action, regional or special-form design changes, environment/background, lighting, color palette, camera angle, and art style/rendering technique.
- Always explicitly include the phrase "Pokemon TCG artwork style" plus the qualifiers "not photorealistic", "not a photograph", and "not a generic fantasy illustration" somewhere in the prompt. Describe the Pokemon's surfaces as smooth and glossy with soft airbrushed shading - never realistic fur, skin, or feather texture.
- Faithfully depict the named Pokemon's canonical design, adapted for any regional form or special form given - keep its exact simplified, game-accurate proportions, do not make it anatomically realistic.
- If two Pokemon are given (tag team), depict both together interacting dynamically in the same scene, same environment.
- Match the rendering style to the rarity tier described.
- Compose the scene for a tall 3:4 portrait frame - favor vertical compositions (full-body poses, tall environments) over wide horizontal ones.
- Aside from the required "Pokemon TCG artwork style" phrase, never mention other card game terms like "card", "rarity", "border", or "text box" - describe only the illustration artwork itself, full-bleed, no frame.
- Do not include any Pokemon that was not specified.`;

/**
 * Appended in code (not left to the drafting model's discretion) so the
 * style lock always reaches the image model, even if the drafted prompt
 * drifts from the system prompt's instructions.
 */
export const STYLE_SUFFIX =
  " Rendered in modern Pokemon TCG artwork style: smooth, glossy, semi-stylized creature design with soft airbrushed shading and crisp clean edges, set against a richly detailed painted background, vibrant saturated colors, professional official video-game-splash-art finish. Not photorealistic, not a photograph, not realistic fur/skin/feather texture, not a 3D render, not a generic fantasy illustration. Borderless, full-bleed artwork only - no card frame, no UI elements, no text, no logos, no watermarks. Make the scene, action, interaction, and camera angle unique and imaginative each time rather than a generic repeated pose - always nice and different.";

export const JUDGE_SYSTEM_PROMPT = `You are judging a friendly 1-on-1 Pokemon TCG art showdown between two AI-generated illustrations, Card A and Card B. You'll see each image plus which Pokemon it depicts. Pick whichever card is more impressive overall - art quality, dynamism, rarity feel, and how well it captures its Pokemon - and would win this round.

Respond with EXACTLY two lines and nothing else:
A or B (just the single letter, whichever wins)
A short, fun, one-sentence reason (max 20 words)`;

export function buildUserPrompt(body: PromptRequestBody): string {
  const pokemonList = body.pokemons.map((p) => p.name).join(" and ");
  const lines = [
    `Pokemon: ${pokemonList}`,
    `Regional form: ${body.region.label} - ${body.region.blurb}`,
    `Special form: ${body.specialForm.label} - ${body.specialForm.blurb}`,
    `Rarity/art tier: ${body.artType.label} - ${body.artType.blurb}`,
  ];
  return lines.join("\n");
}
