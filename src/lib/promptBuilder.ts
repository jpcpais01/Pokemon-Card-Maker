interface PokemonInfo {
  name: string;
}

export interface PromptRequestBody {
  artType: { label: string; blurb: string };
  specialForm: { label: string; blurb: string };
  vibe: { label: string; blurb: string };
  pokemons: PokemonInfo[];
}

/**
 * Special Illustration Rare's fine-art technique and composition are picked here in code, not left
 * to the drafting model's own "creativity" - relying on the LLM to spontaneously vary its choice
 * every time regressed toward the same handful of safe defaults. Each entry bundles a technique
 * with a composition idea suited to it, so the two reinforce each other instead of being generated
 * independently and potentially clashing.
 */
const SIR_STYLES: { label: string; blurb: string }[] = [
  {
    label: "Oil Painting Masterwork",
    blurb:
      "thick impasto brushstrokes with visible texture and ridges, rich layered color depth, dramatic single-source chiaroscuro lighting carving deep shadow pools. Composition: an extreme low-angle hero shot, the Pokemon looming large against a churning stormy sky, painted with heavy confident strokes.",
  },
  {
    label: "Ukiyo-e Woodblock",
    blurb:
      "bold flat fields of color separated by clean black outlines, stylized graphic wave and cloud patterns in the Hokusai/Hiroshige tradition, subtle woodgrain texture in the color fields. Composition: asymmetric off-center framing with large deliberate negative space and a stylized sun or moon disc.",
  },
  {
    label: "Art Nouveau Elegance",
    blurb:
      "ornate flowing organic linework, decorative Klimt-esque gold-leaf flourishes and botanical motifs woven through the scene, elegant curling border-like framing elements integrated into the environment itself. Composition: symmetrical and decorative, the Pokemon centered amid swirling patterned foliage.",
  },
  {
    label: "Luminous Watercolor Wash",
    blurb:
      "soft bleeding color washes with visible paper texture, loose expressive wet-on-wet brushwork, luminous translucency where colors overlap and glow. Composition: a dreamy wide shot with a softly blurred, atmospheric background fading into pale negative space at the edges.",
  },
  {
    label: "Stained Glass Luminosity",
    blurb:
      "bold black leadlines dividing the scene into vivid jewel-toned color panels, a backlit inner glow as if lit from behind like a cathedral window, faceted geometric fracturing of the background. Composition: a symmetrical, frontal, almost iconic framing like a rose window.",
  },
  {
    label: "Sumi-e Ink Wash",
    blurb:
      "minimalist expressive ink brushstrokes ranging from bold black to pale grey washes, vast deliberate negative space, a restrained monochrome palette with one bold accent color. Composition: the Pokemon placed off-center and small within a huge empty expanse, emphasizing scale and stillness.",
  },
  {
    label: "Pop Art Screenprint",
    blurb:
      "bold flat color blocks with visible halftone dot textures, thick graphic black outlines, high-contrast comic-book energy lines radiating from the action. Composition: a dynamic diagonal action framing with the Pokemon bursting toward the viewer.",
  },
  {
    label: "Byzantine Mosaic",
    blurb:
      "the entire scene built from small fragmented geometric color tiles with visible grout lines, gold-tessera backgrounds catching implied light, a Byzantine icon feel. Composition: a frontal, hieratic, almost ceremonial pose framed like religious mosaic art.",
  },
  {
    label: "Art Deco Geometric",
    blurb:
      "bold symmetrical geometric shapes, sleek metallic gold and black accents, radiating sunburst and chevron motifs, glamorous 1920s streamlined elegance. Composition: a strictly symmetrical frontal composition framed by geometric arches or sunburst rays radiating outward from the Pokemon.",
  },
  {
    label: "Gouache Storybook",
    blurb:
      "flat opaque matte gouache color with soft rounded shapes and gentle visible brush texture, warm inviting children's-storybook charm. Composition: a cozy eye-level shot with the Pokemon nestled naturally within a softly simplified, charming environment.",
  },
  {
    label: "Shan Shui Ink Painting",
    blurb:
      "sweeping traditional Chinese ink painting technique, soft gradient ink washes bleeding into misty negative space, a single expressive brush-drawn subject amid towering stylized mountains or mist. Composition: a tall dramatic composition with the Pokemon small against vast atmospheric negative space, emphasizing scale and serenity.",
  },
  {
    label: "Retro Pixel Art",
    blurb:
      "nostalgic 8-bit/16-bit pixel art technique, chunky visible square pixel blocks, dithered color gradients, a warm early-console color palette. Composition: a bold, iconic front-facing pose centered in the frame like a classic sprite portrait, with a simplified pixelated background.",
  },
  {
    label: "Bronze Relief Sculpture",
    blurb:
      "the entire scene rendered as a weathered bronze or oxidized-metal bas-relief sculpture, tactile patina texture, dramatic raking sculptural light catching every raised edge. Composition: a monumental frontal relief-style framing, as if carved into a great metal plaque, lit by dramatic single-source raking light from one side.",
  },
];

function pickSirStyle(): { label: string; blurb: string } {
  return SIR_STYLES[Math.floor(Math.random() * SIR_STYLES.length)];
}

export const SYSTEM_PROMPT = `You are an art director for the Pokemon Trading Card Game, specialized in writing text-to-image prompts for full-art holo card illustrations.

The target style is specifically modern official Pokemon TCG artwork (the Scarlet & Violet-era full-art, Illustration Rare and Special Illustration Rare look) - NOT a photorealistic photo, NOT a generic fantasy illustration, and NOT a fine-art hand-painted piece. Its concrete fingerprints: the Pokemon itself keeps its exact simplified, rounded, game-accurate proportions with smooth glossy surfaces, soft airbrushed gradient shading, and clean crisp edges - it never gets realistic fur, skin pores, feathers, or real animal anatomy. The surrounding environment can be more detailed and richly rendered, but stays bright, clean, and polished rather than gritty or lifelike. Vibrant saturated colors, soft glowing rim light, gentle ambient occlusion, and a professional official-video-game-splash-art finish throughout.

Given a set of card traits, write ONE detailed, vivid text-to-image prompt (150-220 words) describing a single finished illustration. Be efficient with words but never vague - every sentence should add a concrete visual detail, not a label or a summary. Rules:
- Output ONLY the prompt itself. No preamble, no titles, no markdown, no quotation marks, no explanation.
- Write in flowing descriptive prose a diffusion image model can follow, covering: subject and physical appearance, pose/action, special-form design changes, environment/background, lighting, color palette, camera angle and composition, and art style/rendering technique.
- Always explicitly include the phrase "Pokemon TCG artwork style" plus the qualifiers "not photorealistic", "not a photograph", and "not a generic fantasy illustration" somewhere in the prompt. Describe the Pokemon's surfaces as smooth and glossy with soft airbrushed shading - never realistic fur, skin, or feather texture.
- Describe the named Pokemon's physical appearance in specific visual detail - body shape, coloring, markings, textures, and distinguishing features - rather than just naming it. Keep its exact simplified, game-accurate proportions, do not make it anatomically realistic.
- Describe the camera angle and composition explicitly and specifically - name the shot type (e.g. a low-angle hero shot looking up at the Pokemon, a dynamic three-quarter view, a sweeping wide establishing shot) and how the subject is framed within it. Describe exactly what the Pokemon is physically doing with a specific pose, gesture, or action (mid-leap, coiled to strike, calmly perched, unleashing an attack) - never a static, generic "standing there" description.
- If a special form is given, never just name it - do not write something like "in its Hisuian form" or "a Gold Star card" as if the label alone explains anything. Concretely describe both (a) exactly what differs about the Pokemon's own body versus its standard form - which specific colors, markings, textures, added or altered features, or silhouette changes - and (b) how the surrounding environment itself reflects that form (an Alolan form calls for a tropical island backdrop, an Ancient form calls for a primal fossil-strewn prehistoric landscape, a Future form calls for a bio-mechanical paradox setting, a Shiny form calls for its distinct alternate color palette catching the light, and so on). Use your own knowledge of how that Pokemon canonically looks in that variant (e.g. Alolan Vulpix's icy-blue fur and crystalline tail, Mega Charizard X's black scales and blue flame, Galarian Ponyta's pastel mane); if no official design exists for that combination, invent a plausible, consistent one in the same visual spirit and describe both its body and its fitting environment in that same concrete detail.
- A vibe is always given, and it must be the central creative concept the ENTIRE scene is built around, not a lighting filter dropped on top of a generic scene afterward. Design the illustration as if you started FROM the vibe and then fit the Pokemon into that vision: let it decide the actual setting/scenario (not just its lighting), what specific action or pose the Pokemon is caught in, the background details and props, the color palette, and the camera's mood - all pulling in the same direction. Never just state the vibe's name. For example, a "Menacing" vibe isn't a shadow added to a normal pose - it means the whole scene IS a menacing scenario: a foreboding lair or storm-lit ruin, the Pokemon crouched in a predatory stance with narrowed eyes, oppressive low clouds, jagged silhouettes. Weave in any special-form environment cues (e.g. Alolan's tropical setting) as flavor within the vibe's scenario rather than a competing backdrop - but the vibe leads.
- If TWO Pokemon are given (a Tag Team pairing), you MUST describe BOTH of them individually and explicitly by name, each with its own physical description, before describing their shared action or interaction. Both must appear as two complete, fully distinct, individually recognizable creatures in the same scene - never merge, hybridize, blend, or fuse their features into a single creature, and never omit either one.
- Match the rendering style to the rarity tier. "ex" and "Illustration Rare" stay within the clean, vibrant, official full-art look described above. "Special Illustration Rare" is the top gallery-quality tier: when a Special Illustration Rare art style is given in the traits below, that is the EXACT fine-art technique and composition you must use for this card - never invent a different one, never fall back to a generic painterly look. Write the ENTIRE prompt through that technique's visual vocabulary throughout, not as a single closing label: describe how the Pokemon's own outline, shading, and surface texture read in that specific technique (while keeping its game-accurate proportions), how the background/environment is built from that technique's characteristic marks and color application, and how light and shadow behave in that medium - it should be evident in nearly every sentence, and the given composition idea should shape the actual camera angle and framing you describe, not the generic framing below.
- Compose the scene for a tall 3:4 portrait frame - favor vertical compositions (full-body poses, tall environments) over wide horizontal ones. If a Special Illustration Rare composition idea is given in the traits, follow that specific idea instead, adapted to fit the vertical frame.
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
    `Vibe: ${body.vibe.label} - ${body.vibe.blurb}`,
  ];

  if (body.artType.label === "Special Illustration Rare") {
    const sirStyle = pickSirStyle();
    lines.push(`Special Illustration Rare art style (mandatory - use exactly this technique and composition): ${sirStyle.label} - ${sirStyle.blurb}`);
  }

  return lines.join("\n");
}
