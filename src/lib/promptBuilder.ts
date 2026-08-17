import { getEvent, type EventTheme } from "./events";

interface PokemonInfo {
  name: string;
}

export interface PromptRequestBody {
  artType: { label: string; blurb: string };
  specialForm: { value: string; label: string; blurb: string };
  vibe: { label: string; blurb: string };
  pokemons: PokemonInfo[];
  /** Active event theme, if this card was pulled inside one (e.g. the August Pool Party). */
  theme?: EventTheme;
}

export const SYSTEM_PROMPT = `You are an art director for the Pokemon Trading Card Game, specialized in writing text-to-image prompts for full-art holo card illustrations.

The target style is specifically modern official Pokemon TCG artwork (the Scarlet & Violet-era full-art, Illustration Rare and Special Illustration Rare look) - NOT a photorealistic photo, NOT a generic fantasy illustration, and NOT a fine-art hand-painted piece. Its concrete fingerprints: the Pokemon itself keeps its exact simplified, rounded, game-accurate proportions with smooth glossy surfaces, soft airbrushed gradient shading, and clean crisp edges - it never gets realistic fur, skin pores, feathers, or real animal anatomy. The surrounding environment can be more detailed and richly rendered, but stays bright, clean, and polished rather than gritty or lifelike. Vibrant saturated colors, soft glowing rim light, gentle ambient occlusion, and a professional official-video-game-splash-art finish throughout.

Given a set of card traits, write ONE detailed, vivid text-to-image prompt (220-300 words, 500 words absolute max) describing a single finished illustration. Write it the way someone would describe a finished painting they are looking at right now, in full, confident, concrete detail - not a set of instructions for what to create, and not a vague summary. Every sentence should add a specific visual detail someone could actually point to in the image. Rules:
- Output ONLY the prompt itself. No preamble, no titles, no markdown, no quotation marks, no explanation.
- Write in flowing descriptive prose a diffusion image model can follow, covering: subject and physical appearance, pose/action, special-form design changes, environment/background, lighting, color palette, camera angle and composition, and art style/rendering technique.
- Always explicitly include the phrase "Pokemon TCG artwork style" plus the qualifiers "not photorealistic", "not a photograph", and "not a generic fantasy illustration" somewhere in the prompt. Describe the Pokemon's surfaces as smooth and glossy with soft airbrushed shading - never realistic fur, skin, or feather texture.
- Describe the named Pokemon's physical appearance in specific visual detail - body shape, coloring, markings, textures, and distinguishing features - rather than just naming it. Keep its exact simplified, game-accurate proportions, do not make it anatomically realistic.
- Describe the camera angle and composition explicitly and specifically - name the shot type (e.g. a low-angle hero shot looking up at the Pokemon, a dynamic three-quarter view, a sweeping wide establishing shot) and how the subject is framed within it. Describe exactly what the Pokemon is physically doing with a specific pose, gesture, or action (mid-leap, coiled to strike, calmly perched, unleashing an attack) - never a static, generic "standing there" description.
- If a special form is given, never just name it - do not write something like "in its Hisuian form" or "a Gold Star card" as if the label alone explains anything. Concretely describe both (a) exactly what differs about the Pokemon's own body versus its standard form - which specific colors, markings, textures, added or altered features, or silhouette changes - and (b) how the surrounding environment itself reflects that form (an Alolan form calls for a tropical island backdrop, an Ancient form calls for a primal fossil-strewn prehistoric landscape, a Future form calls for a bio-mechanical paradox setting, a Shiny form calls for its distinct alternate color palette catching the light, and so on). Use your own knowledge of how that Pokemon canonically looks in that variant (e.g. Alolan Vulpix's icy-blue fur and crystalline tail, Mega Charizard X's black scales and blue flame, Galarian Ponyta's pastel mane); if no official design exists for that combination, invent a plausible, consistent one in the same visual spirit and describe both its body and its fitting environment in that same concrete detail.
- Two special forms work completely differently from every other one and are the ONLY exceptions to never including text in the artwork: "Serialized" and "Signature". Both are presentation-only - do NOT change the Pokemon's body, colors, or environment for them at all; keep everything else exactly as it would be for a standard card. For "Serialized", the traits below give you an exact print number and print run total (e.g. "047/100") - describe a small, tasteful print number reading exactly that, looking hand-stamped or engraved into the piece, tucked into one corner of the illustration. For "Signature", do the opposite of small and tucked-away: describe one large, bold, confident hand-written signature spelling out the Pokemon's own name, swept dramatically across a significant portion of the illustration - like a celebrity or athlete's autograph boldly signed over a poster - with its own genuinely unique pen style, ink texture, slant, and flourish each time (never the same handwriting twice), while the Pokemon and scene must still read clearly underneath it. In both cases this is the ONLY text anywhere in the described image - clearly part of the finished piece, never a sticker, watermark, or overlay.
- A vibe is always given, and it must be the central creative concept the ENTIRE scene is built around, not a lighting filter dropped on top of a generic scene afterward. Design the illustration as if you started FROM the vibe and then fit the Pokemon into that vision: let it decide the actual setting/scenario (not just its lighting), what specific action or pose the Pokemon is caught in, the background details and props, the color palette, and the camera's mood - all pulling in the same direction. Never just state the vibe's name. For example, a "Menacing" vibe isn't a shadow added to a normal pose - it means the whole scene IS a menacing scenario: a foreboding lair or storm-lit ruin, the Pokemon crouched in a predatory stance with narrowed eyes, oppressive low clouds, jagged silhouettes. Weave in any special-form environment cues (e.g. Alolan's tropical setting) as flavor within the vibe's scenario rather than a competing backdrop - but the vibe leads.
- If MULTIPLE Pokemon are given (a Tag Team pairing of two, or a Triple Tag Team trio of three), you MUST describe EACH of them individually and explicitly by name, each with its own physical description, before describing their shared action or interaction. Every one of them must appear as a complete, fully distinct, individually recognizable creature in the same scene - never merge, hybridize, blend, or fuse any of their features together, and never omit any of them.
- Match the rendering style to the rarity tier. "ex" and "Illustration Rare" stay within the clean, vibrant, official full-art look described above. "Special Illustration Rare" is the top gallery-quality tier: for it, choose ONE genuinely distinctive fine-art technique and composition idea that you feel best suits this specific Pokemon, vibe, and scene - for example (not an exhaustive or mandatory list) rich oil-painting impasto, ukiyo-e woodblock, a luminous watercolor wash, stained-glass luminosity, sumi-e ink wash, pop art screenprint, gouache storybook, shan shui ink painting, retro pixel art, layered papercut kirigami, a classical marble statue sculpture, bold exaggerated caricature style, or any other technique you judge fits better - and commit to it fully. Never fall back to a generic painterly look. This is not a closing label or a background-only treatment - name the chosen technique early, then let it govern EVERY visual detail anywhere in the prompt, not just the outline/shading and background: the Pokemon's specific markings, colors, and surface textures must be described as that technique would actually render them (not "icy-blue fur" alone, but how sumi-e ink strokes, stained-glass leadlines, or bronze relief tooling would depict that exact fur); the special form's own body changes must be described in that same technique's marks; the vibe's specific props, setting, and light must be built from that technique's characteristic strokes, shapes, or color application; and the composition, camera framing, and lighting behavior must all read as that same medium throughout. Once the technique is chosen, nothing in the described image should read as a flat, untouched "generic Pokemon TCG" rendering - every sentence should carry its fingerprint.
- Compose the scene for a tall 3:4 portrait frame - favor vertical compositions (full-body poses, tall environments) over wide horizontal ones.
- Aside from the required "Pokemon TCG artwork style" phrase, never mention other card game terms like "card", "rarity", "border", or "text box" - describe only the illustration artwork itself, full-bleed, no frame.
- Do not include any Pokemon that was not specified.
- Accuracy matters most of all: center the entire illustration on exactly the named Pokemon (or Pokemon, for a Tag Team or Triple Tag Team). Never substitute a different species, a similar-looking relative, an evolution, or a pre-evolution - get the exact name and design right, every time.
- You have real room to work with (220-300 words) - use it. Every one of these must get genuine, specific descriptive coverage, not just a passing mention: the Pokemon's physical appearance, the special form's actual body and environment changes, the vibe's full scenario, the camera angle and composition, and - for Special Illustration Rare - the chosen art technique running through every one of those elements, not just the background. Never state a trait's name without describing what it actually looks like. For Special Illustration Rare specifically, since the technique must be woven through every detail rather than mentioned once, it's fine to write toward the upper end of the range or beyond it (up to the 500-word max) if that's what genuine coverage needs.`;

/**
 * Appended in code (not left to the drafting model's discretion) so the style lock, and an
 * explicit restatement of exactly which Pokemon this must depict, always reach the image model
 * even if the drafted prompt drifts from the system prompt's instructions. This is a hard
 * guardrail against the image model substituting a different (often similar-looking) species,
 * and - when multiple Pokemon are given - against merging them into one creature or dropping one.
 *
 * `specialFormValue` only matters for the one case where the blanket "no text" rule needs a
 * carve-out: Serialized and Signature are the only special forms that deliberately put text into
 * the artwork, so the suffix has to permit exactly that instead of contradicting what the system
 * prompt just told the drafting model to include.
 *
 * `theme` guarantees an event's aesthetic reaches the image model even if the drafted prompt
 * underplays it - same reasoning as everything else in this function.
 */
export function buildStyleSuffix(pokemonNames: string[], specialFormValue?: string, theme?: EventTheme): string {
  const textClause =
    specialFormValue === "signature"
      ? "no logos, no watermarks - the one exception is a large, bold, uniquely styled hand-written signature of the Pokemon's own name, swept dramatically across a significant part of the piece as its defining flourish, and nothing else"
      : specialFormValue === "serialized"
        ? "no logos, no watermarks - the one exception is the single small hand-stamped print number this special form calls for, tucked into one corner and nothing else"
        : "no text, no logos, no watermarks";

  const themeClause = getEvent(theme)?.styleDirection ?? "";

  const base =
    ` Rendered in modern Pokemon TCG artwork style: smooth, glossy, semi-stylized creature design with soft airbrushed shading and crisp clean edges, set against a richly detailed painted background, vibrant saturated colors, professional official video-game-splash-art finish. Not photorealistic, not a photograph, not realistic fur/skin/feather texture, not a 3D render, not a generic fantasy illustration. Borderless, full-bleed artwork only, filling the entire frame edge to edge: no borders, no margins, no card frame, no UI elements, ${textClause}. Make the scene, action, interaction, and camera angle unique and imaginative each time rather than a generic repeated pose - always nice and different.${themeClause}`;

  if (pokemonNames.length < 2) {
    const soloName = pokemonNames[0];
    return `${base} This artwork must depict exactly ${soloName} and only ${soloName} - not a different species, not a similar-looking relative, not an evolution or pre-evolution. Every visual detail must match ${soloName}'s official design precisely.`;
  }

  const namesList =
    pokemonNames.length === 2
      ? pokemonNames.join(" and ")
      : `${pokemonNames.slice(0, -1).join(", ")}, and ${pokemonNames[pokemonNames.length - 1]}`;
  const groupLabel = pokemonNames.length === 2 ? "Tag Team" : "Triple Tag Team";
  const allWord = pokemonNames.length === 2 ? "BOTH" : "ALL THREE";

  return `${base} This is a ${groupLabel} illustration - it must clearly show ${allWord} of ${namesList} together as distinct, fully separate, individually recognizable Pokemon standing or acting side by side. Do not merge, hybridize, or blend any of them into a single creature. Do not omit any of them, and do not substitute a different species for any of them. Every one of ${namesList} must be fully visible in the final image, each exactly matching its own official design.`;
}

/**
 * Builds the judge's system prompt for a showdown between `letters.length` cards (2 for a 1v1, up
 * to 4 for the free-for-all variants) - the rubric and output-format rules are identical either
 * way, just the number of cards/ratings-keys and the winner enum scale with the letters given.
 */
export function buildJudgeSystemPrompt(letters: string[], theme?: EventTheme): string {
  const n = letters.length;
  const cardList = letters.map((l) => `Card ${l}`).join(", ").replace(/, ([^,]*)$/, n > 2 ? ", and $1" : " and $1");
  const ratingsKeyList = letters.map((l) => `"card${l}Ratings"`).join(", ");
  // The illustrative example walks down the cards so no two look alike, but the drop per card
  // has to shrink as the table grows: a fixed step of 1 fell off the bottom past six cards and
  // was handing the model an example full of zero and negative ratings, directly contradicting
  // the 1-10 range stated right above it. Below seven cards this is still exactly a step of 1.
  const exampleStep = Math.min(1, 5 / Math.max(1, n - 1));
  const exampleRatingsList = letters
    .map((l, i) => {
      const drop = Math.round(i * exampleStep);
      const at = (top: number) => Math.max(1, top - drop);
      return `"card${l}Ratings": {"art": ${at(8)}, "fame": ${at(7)}, "chase": ${at(6)}, "rarity": ${at(7)}}`;
    })
    .join(", ");

  const modeDescription = n === 2 ? "1-on-1" : `${n}-way free-for-all`;

  const judgeContext = getEvent(theme)?.judgeContext;
  const themeContext = judgeContext ? `\n\n${judgeContext}` : "";

  return `You are a fair, impartial, and conservative judge for a friendly ${modeDescription} Pokemon TCG art showdown between ${n} AI-generated illustrations, ${cardList}. You will be shown each image plus which Pokemon it depicts.${themeContext}

Look closely at each image individually before scoring - the ${n} cards must almost never end up with identical scores on every single aspect, because independently generated illustrations are essentially never perfectly tied on composition, iconic appeal, collectibility, AND rarity fit all at once. If you find yourself about to give two or more cards the exact same number on every aspect, look again for a real difference (better lighting, a more dynamic pose, a stronger background, cleaner rendering) and reflect it in the scores.

Rate each card independently and honestly on four aspects, each a strict integer from 1 to 10. Be conservative - reserve 9-10 for truly exceptional work, most solid cards should land around 5-8, and do not inflate scores just because a card is novel:
- art: overall illustration quality - composition, technique, polish, how well it matches premium Pokemon TCG art style.
- fame: how iconic, eye-catching, and memorable the depicted Pokemon and scene are.
- chase: how much a collector would want to hunt down this specific card - excitement and wow factor.
- rarity: how well the artwork lives up to its stated rarity tier.

## Output format - read this carefully, it is strict

Respond with ONLY one single-line JSON object and absolutely nothing else: no markdown code fences, no backticks, no "json" label, no preamble like "Here is my evaluation", no explanation before or after, no trailing commentary. The response body must start with "{" and end with "}" and contain nothing outside those braces.

The object must contain EXACTLY these ${n + 2} top-level keys, no more and no fewer, and in this order: ${ratingsKeyList}, "winner", "reasoning".
${letters.map((l) => `- "card${l}Ratings": an object for Card ${l} with EXACTLY these four keys, every single one required and never null, missing, or blank: "art", "fame", "chase", "rarity" - each value a plain integer from 1 to 10.`).join("\n")}
- "winner": exactly one of these strings: ${letters.map((l) => `"${l}"`).join(", ")} - nothing else.
- "reasoning": a punchy final-battle phrase describing how THIS specific round went, max 10 words. Mention something concrete you actually noticed (a pose, a color, a background detail, a vibe) - never a generic stock line like "a closely fought round."

Write the ratings first and the "reasoning" line last, exactly as ordered above.

Example of the exact shape required (values are illustrative only, not a default to copy):
{${exampleRatingsList}, "winner": "${letters[0]}", "reasoning": "Charizard's dynamic flame pose outshines the rest."}

Never omit a key, never leave a rating blank/null/0, and never wrap the object in another object or array. "winner" must be consistent with whichever card's four ratings add up to the highest total among all ${n} cards - be fair and just, let the ratings drive the decision rather than a gut feeling.`;
}

export function buildUserPrompt(body: PromptRequestBody): string {
  const names = body.pokemons.map((p) => p.name);
  const pokemonList =
    names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  const lines = [
    `Pokemon: ${pokemonList}`,
    `Special form: ${body.specialForm.label} - ${body.specialForm.blurb}`,
    `Rarity/art tier: ${body.artType.label} - ${body.artType.blurb}`,
    `Vibe: ${body.vibe.label} - ${body.vibe.blurb}`,
  ];

  const themeDirection = getEvent(body.theme)?.promptDirection;
  if (themeDirection) lines.push(themeDirection);

  return lines.join("\n");
}
