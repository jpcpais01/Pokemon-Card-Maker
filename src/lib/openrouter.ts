const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

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
  return url;
}

export interface CardRatings {
  art: number;
  fame: number;
  chase: number;
  rarity: number;
}

export interface JudgeCardInput {
  /** "A" | "B" | ... | "J" - one per card being judged, 2 to 10 cards. */
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

/** Builds a schema requiring exactly one ratings object per card being judged (2-10 of them). */
function buildJudgeResponseFormat(letters: string[]) {
  const properties: Record<string, unknown> = {
    reasoning: {
      type: "string",
      description: "A punchy, card-specific final-battle phrase, max 10 words. Never a generic stock line.",
    },
    winner: { type: "string", enum: letters, description: "Whichever card's ratings add up highest." },
  };
  const required = ["reasoning", "winner"];
  for (const letter of letters) {
    properties[ratingsKey(letter)] = RATING_SCHEMA;
    required.push(ratingsKey(letter));
  }

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
 * Judges 2 to 10 cards at once (1v1, or any of the free-for-all sizes) and returns per-card
 * ratings plus a single round winner, derived from whichever card's ratings add up highest
 * (the model's own stated "winner" only breaks an exact tie).
 *
 * The ceiling tracks MAX_PLAYERS: every player's artwork goes into one multimodal request,
 * so the whole table is judged against the same eyes in a single pass rather than scored in
 * batches that could never be compared fairly.
 */
export async function judgeMultiBattle(systemPrompt: string, cards: JudgeCardInput[]): Promise<MultiBattleJudgement> {
  if (cards.length < 2 || cards.length > 10) {
    throw new Error(`judgeMultiBattle expects 2-10 cards, got ${cards.length}.`);
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
    // Generous headroom above what the compact JSON payload itself needs - some models spend a
    // chunk of the budget on hidden reasoning before writing the actual answer, and a tight cap
    // here was silently truncating the JSON mid-object, which made every round fall back to the
    // generic response below. Scales with card count since more cards means more ratings fields.
    max_tokens: 500 + cards.length * 250,
    // The same model id can be served by several backing providers on OpenRouter, and only some
    // of them actually enforce every parameter in the request - one that silently ignores
    // response_format is indistinguishable from a working one until the response comes back
    // malformed. This pins routing to providers that honor every parameter we send (including
    // response_format), instead of letting a non-conforming provider intermittently slip through.
    provider: { require_parameters: true },
  };

  const responseFormat = buildJudgeResponseFormat(letters);

  let data: unknown;
  try {
    // Strict structured output: the model is constrained to this exact schema, so it can't
    // silently omit a rating field the way loose "return JSON" prompting sometimes does.
    data = await callOpenRouter({ ...baseBody, response_format: responseFormat });
  } catch (err) {
    console.error("judgeMultiBattle: structured-output request failed, retrying without a schema", err);
    data = await callOpenRouter({ ...baseBody, response_format: { type: "json_object" } });
  }

  const content = (data as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("The judge model returned an empty response.");
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

    // Should be rare now that the response is schema-constrained, but keep a safety net so one
    // truly broken response can't crash the round - and log the raw content so a recurring
    // failure is actually diagnosable instead of silently masked by a fake-looking flat fallback.
    console.error("judgeMultiBattle: failed to parse judge response", err, content);
    const fallback: CardRatings = { art: 5, fame: 5, chase: 5, rarity: 5 };
    const fallbackRatings: Record<string, CardRatings> = {};
    for (const letter of letters) fallbackRatings[letter] = fallback;
    return {
      winnerLetter: letters[Math.floor(Math.random() * letters.length)],
      reason: "The judge's notes got lost in the shuffle - too close to call!",
      ratings: fallbackRatings,
    };
  }
}
