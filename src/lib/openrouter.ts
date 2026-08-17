import sharp from "sharp";
import { MAX_CARDS_PER_JUDGE } from "@/lib/battle/judgePlan";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Wide enough to stay sharp on a 3x-density phone showing the card near full width. */
const MAX_IMAGE_WIDTH = 1024;
/** High enough that the compression is invisible on illustration art at this size. */
const IMAGE_QUALITY = 86;

export const TEXT_MODEL = "google/gemini-3.6-flash";
export const IMAGE_MODEL = "google/gemini-3.1-flash-image";

function apiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured on the server.");
  return key;
}

async function callOpenRouter(body: Record<string, unknown>) {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://pokegen.vercel.app",
      "X-Title": "PokeGen",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter request failed (${res.status}): ${text.slice(0, 500)}`);
  }

  return res.json();
}

export async function generateText(systemPrompt: string, userPrompt: string): Promise<string> {
  const data = await callOpenRouter({
    model: TEXT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.9,
    // Generous headroom above the ~300-word target - same issue as judgeMultiBattle below: some
    // models spend a chunk of the budget on hidden reasoning before writing the actual answer, and
    // a tight cap here was silently truncating the drafted prompt after only a sentence or two,
    // which then got the fixed style suffix glued onto that unfinished fragment.
    max_tokens: 2000,
  });

  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("The prompt model returned an empty response.");
  }
  if (choice?.finish_reason === "length") {
    // Never silently ship a truncated, mid-sentence draft - surface it as a retryable failure
    // instead, same as an empty response.
    throw new Error("The prompt model's response was cut off before finishing.");
  }
  return content.trim();
}

/**
 * Re-encodes a generated image as a JPEG before it ever leaves the server.
 *
 * The image model hands back a PNG data URL, and for a detailed 1024x1365 illustration that is
 * routinely 3-4MB - about 4.8MB once it's base64. Every one of those crosses the network, then
 * lives on as a JS string in the client (in battle, one per player per round) and again in
 * IndexedDB for anything saved to the binder. PNG is simply the wrong format for this content:
 * it's lossless, and card art is a photograph-like image with no flat color or transparency to
 * preserve. The same picture as a quality-86 JPEG is roughly a tenth of the size with no
 * visible difference, which is the difference between a phone browser coping and its renderer
 * being killed mid-match.
 *
 * Deliberately fail-soft: if anything here throws, the original data URL is returned untouched.
 * A heavier image is worth far more than a failed pull.
 */
async function toCompactJpeg(dataUrl: string): Promise<string> {
  try {
    const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    const input = Buffer.from(base64, "base64");
    const output = await sharp(input)
      // `withoutEnlargement` so a model that ever returns something smaller is left alone
      // rather than being upscaled into a bigger file for no extra detail.
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: IMAGE_QUALITY, mozjpeg: true })
      .toBuffer();
    // Only take the re-encode if it actually helped - never ship a bigger image than we got.
    if (output.length >= input.length) return dataUrl;
    return `data:image/jpeg;base64,${output.toString("base64")}`;
  } catch (err) {
    console.error("toCompactJpeg: falling back to the original image", err);
    return dataUrl;
  }
}

export async function generateImage(prompt: string): Promise<string> {
  const data = await callOpenRouter({
    model: IMAGE_MODEL,
    messages: [{ role: "user", content: prompt }],
    modalities: ["image", "text"],
    image_config: { aspect_ratio: "3:4" },
  });

  const images = data?.choices?.[0]?.message?.images;
  const url = images?.[0]?.image_url?.url;
  if (!url || typeof url !== "string") {
    throw new Error("The image model did not return an image.");
  }
  return toCompactJpeg(url);
}

export interface CardRatings {
  art: number;
  fame: number;
  chase: number;
  rarity: number;
}

export interface JudgeCardInput {
  /** "A" | "B" | "C" - one per card in this judging group, 2 or 3 of them. */
  letter: string;
  image: string;
  names: string;
}

export interface MultiBattleJudgement {
  winnerLetter: string;
  reason: string;
  /** Keyed by the same letters passed in via JudgeCardInput. */
  ratings: Record<string, CardRatings>;
}

/**
 * Pulls the JSON object out of a model response, tolerating ```json fences and any stray
 * preamble/trailing prose around it (some models add a stray sentence despite instructions not
 * to) by slicing from the first `{` to the last `}` rather than requiring the whole string to be
 * pure JSON.
 */
function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : trimmed;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return candidate;
  return candidate.slice(start, end + 1);
}

function clampRating(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Math.min(10, Math.max(1, Math.round(n)));
}

/**
 * Requires all four fields to actually be present as finite numbers - a response missing them
 * (e.g. an empty or degenerate JSON object slipping past `response_format`) throws instead of
 * silently coercing to a flat, fake-looking 5 that's indistinguishable from a real judgement.
 */
function parseRatingsStrict(raw: unknown, cardLabel: string): CardRatings {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  for (const key of ["art", "fame", "chase", "rarity"] as const) {
    const n = typeof obj[key] === "number" ? obj[key] : Number(obj[key]);
    if (!Number.isFinite(n)) {
      throw new Error(`${cardLabel} is missing a valid "${key}" rating.`);
    }
  }
  return {
    art: clampRating(obj.art),
    fame: clampRating(obj.fame),
    chase: clampRating(obj.chase),
    rarity: clampRating(obj.rarity),
  };
}

function ratingsTotal(ratings: CardRatings): number {
  return ratings.art + ratings.fame + ratings.chase + ratings.rarity;
}

/**
 * Last-resort recovery for a response that fails JSON.parse (a stray unescaped quote inside
 * "reasoning", a trailing comma, etc. can break the whole document even though the actual rating
 * numbers are perfectly intact). Scans the raw text directly for `"blockKey": { ... "field": N ... }`
 * patterns instead of requiring the whole response to be syntactically valid JSON.
 */
function regexExtractRatings(text: string, blockKey: string): CardRatings | null {
  const blockStart = text.indexOf(`"${blockKey}"`);
  if (blockStart === -1) return null;
  // The ratings object itself is compact (4 short numeric fields) - a few hundred characters is
  // always enough room to contain it even with generous whitespace.
  const block = text.slice(blockStart, blockStart + 300);

  const values: Partial<Record<"art" | "fame" | "chase" | "rarity", number>> = {};
  for (const key of ["art", "fame", "chase", "rarity"] as const) {
    const match = block.match(new RegExp(`"${key}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`));
    if (!match) return null;
    values[key] = Number(match[1]);
  }

  return {
    art: clampRating(values.art),
    fame: clampRating(values.fame),
    chase: clampRating(values.chase),
    rarity: clampRating(values.rarity),
  };
}

function regexExtractReason(text: string): string | null {
  const match = text.match(/"reasoning"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (!match) return null;
  const unescaped = match[1].replace(/\\"/g, '"').replace(/\\n/g, " ").trim();
  return unescaped || null;
}

/**
 * Structured-output schema so the model is constrained to return exactly the fields we need -
 * this is a much stronger guarantee than the loose `json_object` mode, which only promises valid
 * JSON syntax and lets a model return something minimal/degenerate that still parses fine.
 */
const RATING_SCHEMA = {
  type: "object",
  properties: {
    art: { type: "integer", minimum: 1, maximum: 10, description: "Illustration quality, 1-10." },
    fame: { type: "integer", minimum: 1, maximum: 10, description: "How iconic/memorable the scene is, 1-10." },
    chase: { type: "integer", minimum: 1, maximum: 10, description: "Collector excitement/wow factor, 1-10." },
    rarity: { type: "integer", minimum: 1, maximum: 10, description: "How well it lives up to its rarity tier, 1-10." },
  },
  required: ["art", "fame", "chase", "rarity"],
  additionalProperties: false,
};

const ratingsKey = (letter: string) => `card${letter}Ratings`;

/**
 * Builds a schema requiring exactly one ratings object per card in the group (2 or 3).
 *
 * The ratings come FIRST and the prose last, deliberately. Models emitting a strict schema
 * follow the property order they were given, and the one thing a truncated response must not
 * lose is the numbers - they're what the whole round is scored on, while "reasoning" is flavour
 * with a perfectly good default. Ordered the other way round (as this was), a response cut off
 * early kept the flavour text and dropped every score.
 */
function buildJudgeResponseFormat(letters: string[]) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const letter of letters) {
    properties[ratingsKey(letter)] = RATING_SCHEMA;
    required.push(ratingsKey(letter));
  }
  properties.winner = { type: "string", enum: letters, description: "Whichever card's ratings add up highest." };
  properties.reasoning = {
    type: "string",
    description: "A punchy, card-specific final-battle phrase, max 10 words. Never a generic stock line.",
  };
  required.push("winner", "reasoning");

  return {
    type: "json_schema",
    json_schema: {
      name: "battle_judgement",
      strict: true,
      schema: { type: "object", properties, required, additionalProperties: false },
    },
  };
}

/** Picks whichever letter has the highest ratings total; ties split randomly among the leaders. */
function pickWinnerByTotals(ratings: Record<string, CardRatings>, fallbackLetter?: string): string {
  const entries = Object.entries(ratings).map(([letter, r]) => [letter, ratingsTotal(r)] as const);
  const maxTotal = Math.max(...entries.map(([, total]) => total));
  const leaders = entries.filter(([, total]) => total === maxTotal).map(([letter]) => letter);
  if (leaders.length === 1) return leaders[0];
  if (fallbackLetter && leaders.includes(fallbackLetter)) return fallbackLetter;
  return leaders[Math.floor(Math.random() * leaders.length)];
}

/**
 * Judges one small group of cards - 2 or 3 - and returns per-card ratings plus the group's
 * best, derived from whichever card's ratings add up highest (the model's own stated "winner"
 * only breaks an exact tie).
 *
 * A whole table is judged as several of these groups; see `planJudgeBatches`. The low ceiling
 * is the point: two or three images is a comparison one pass can make carefully, and because
 * the rubric scores each card absolutely rather than ranking it against its neighbours, the
 * totals stay comparable across groups.
 */
export async function judgeMultiBattle(systemPrompt: string, cards: JudgeCardInput[]): Promise<MultiBattleJudgement> {
  if (cards.length < 2 || cards.length > MAX_CARDS_PER_JUDGE) {
    throw new Error(`judgeMultiBattle expects 2-${MAX_CARDS_PER_JUDGE} cards, got ${cards.length}.`);
  }
  const letters = cards.map((c) => c.letter);

  const userContent = cards.flatMap((c) => [
    { type: "text", text: `Card ${c.letter} - ${c.names}` },
    { type: "image_url", image_url: { url: c.image } },
  ]);
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  const baseBody = {
    model: TEXT_MODEL,
    messages,
    temperature: 0.6,
    /*
     * This has to cover hidden reasoning as well as the answer, and the judge does *more*
     * thinking than anything else here because it is also looking at two or three images.
     *
     * It used to be 500 + 250/card - roughly 1000 tokens - which is less than half of what plain
     * prompt drafting needed (see generateText, whose comment records the same lesson). A judge
     * that spends its whole budget thinking emits nothing at all, and an empty response is thrown
     * as a failure, which is a good part of why judging failed as often as it did.
     */
    max_tokens: 2000 + cards.length * 500,
  };

  /*
   * `require_parameters` pins routing to providers that honour every parameter we send, so a
   * provider that silently ignores response_format can't quietly serve a malformed answer. It is
   * only worth that on the strict attempt: paired with a json_schema request and image input it
   * narrows the eligible providers a long way, and if the narrowing is itself what failed, a
   * retry that keeps it fails in exactly the same way. Each attempt below therefore relaxes one
   * more constraint rather than repeating the same request.
   */
  const attempts: Record<string, unknown>[] = [
    { ...baseBody, response_format: buildJudgeResponseFormat(letters), provider: { require_parameters: true } },
    { ...baseBody, response_format: { type: "json_object" } },
    // Last resort: no response_format at all. The system prompt already specifies the exact
    // object down to the key names, and `extractJson` copes with fences and stray prose.
    baseBody,
  ];

  let data: unknown;
  let lastError: unknown;
  for (const [i, body] of attempts.entries()) {
    try {
      data = await callOpenRouter(body);
      lastError = undefined;
      break;
    } catch (err) {
      lastError = err;
      console.error(`judgeMultiBattle: request attempt ${i + 1}/${attempts.length} failed`, err);
    }
  }
  if (lastError) throw lastError;

  const choice = (
    data as { choices?: { message?: { content?: unknown }; finish_reason?: string }[] }
  )?.choices?.[0];
  const content = choice?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("The judge model returned an empty response.");
  }
  // Surfaced rather than parsed around: a response cut off at the token limit is missing ratings,
  // and the recovery below would at best rescue some of them. Raising max_tokens is the fix; this
  // makes it say so in the log instead of looking like a malformed-JSON problem.
  if (choice?.finish_reason === "length") {
    console.error("judgeMultiBattle: response hit the token limit before finishing", content.slice(0, 400));
  }

  try {
    const parsed = JSON.parse(extractJson(content)) as Record<string, unknown>;

    const ratings: Record<string, CardRatings> = {};
    for (const letter of letters) {
      ratings[letter] = parseRatingsStrict(parsed[ratingsKey(letter)], `Card ${letter}`);
    }

    const statedWinner = typeof parsed.winner === "string" ? parsed.winner.trim().toUpperCase() : "";
    const winnerLetter = pickWinnerByTotals(ratings, letters.includes(statedWinner) ? statedWinner : undefined);

    const reason =
      typeof parsed.reasoning === "string" && parsed.reasoning.trim()
        ? parsed.reasoning.trim()
        : "A closely fought round!";

    return { winnerLetter, reason, ratings };
  } catch (err) {
    // JSON.parse can fail on a response that's 99% correct - a stray unescaped quote inside
    // "reasoning" or a trailing comma breaks the whole document even though the actual rating
    // numbers are sitting right there in the text. Try to recover them directly before giving up.
    const recovered: Record<string, CardRatings> = {};
    let allRecovered = true;
    for (const letter of letters) {
      const r = regexExtractRatings(content, ratingsKey(letter));
      if (!r) {
        allRecovered = false;
        break;
      }
      recovered[letter] = r;
    }

    if (allRecovered) {
      console.error("judgeMultiBattle: JSON.parse failed, recovered ratings via regex fallback", err, content);
      const winnerLetter = pickWinnerByTotals(recovered);
      const reason = regexExtractReason(content) ?? "A hard-fought round with a narrow edge.";
      return { winnerLetter, reason, ratings: recovered };
    }

    /*
     * Throw rather than inventing ratings.
     *
     * This used to return a flat 5/5/5/5 for every card so that "one broken response can't crash
     * the round" - but returning meant the call had *succeeded*, so the caller's retry chain
     * (themed -> unthemed -> one more go, in battle/advance) never ran for the single most common
     * failure there is. A malformed response was answered once, quietly, with fabricated numbers
     * that scored every card in the group identically and read on screen as a real judgement.
     *
     * Failing loudly instead lets those retries do their job, and the caller decides what a group
     * that exhausted them is worth - which it can do far better from out there, where it knows
     * about the other groups.
     */
    console.error("judgeMultiBattle: failed to parse judge response", err, content);
    throw new Error("The judge's response could not be read.");
  }
}
