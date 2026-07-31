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
    max_tokens: 700,
  });

  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("The prompt model returned an empty response.");
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

export interface BattleJudgement {
  winner: "A" | "B";
  reason: string;
  card1Ratings: CardRatings;
  card2Ratings: CardRatings;
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
 * Structured-output schema so the model is constrained to return exactly the fields we need -
 * this is a much stronger guarantee than the loose `json_object` mode, which only promises valid
 * JSON syntax and lets a model return something minimal/degenerate that still parses fine.
 */
const RATING_SCHEMA = {
  type: "object",
  properties: {
    art: { type: "integer", minimum: 1, maximum: 10 },
    fame: { type: "integer", minimum: 1, maximum: 10 },
    chase: { type: "integer", minimum: 1, maximum: 10 },
    rarity: { type: "integer", minimum: 1, maximum: 10 },
  },
  required: ["art", "fame", "chase", "rarity"],
  additionalProperties: false,
};

const JUDGE_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "battle_judgement",
    strict: true,
    schema: {
      type: "object",
      properties: {
        reasoning: { type: "string" },
        winner: { type: "string", enum: ["A", "B"] },
        card1Ratings: RATING_SCHEMA,
        card2Ratings: RATING_SCHEMA,
      },
      required: ["reasoning", "winner", "card1Ratings", "card2Ratings"],
      additionalProperties: false,
    },
  },
};

export async function judgeBattle(
  systemPrompt: string,
  imageA: string,
  namesA: string,
  imageB: string,
  namesB: string
): Promise<BattleJudgement> {
  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: `Card A - ${namesA}` },
        { type: "image_url", image_url: { url: imageA } },
        { type: "text", text: `Card B - ${namesB}` },
        { type: "image_url", image_url: { url: imageB } },
      ],
    },
  ];

  const baseBody = {
    model: TEXT_MODEL,
    messages,
    temperature: 0.6,
    // Generous headroom above what the compact JSON payload itself needs - some models spend a
    // chunk of the budget on hidden reasoning before writing the actual answer, and a tight cap
    // here was silently truncating the JSON mid-object, which made every round fall back to the
    // generic response below.
    max_tokens: 700,
  };

  let data: unknown;
  try {
    // Strict structured output: the model is constrained to this exact schema, so it can't
    // silently omit a rating field the way loose "return JSON" prompting sometimes does.
    data = await callOpenRouter({ ...baseBody, response_format: JUDGE_RESPONSE_FORMAT });
  } catch (err) {
    console.error("judgeBattle: structured-output request failed, retrying without a schema", err);
    data = await callOpenRouter({ ...baseBody, response_format: { type: "json_object" } });
  }

  const content = (data as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("The judge model returned an empty response.");
  }

  try {
    const parsed = JSON.parse(extractJson(content)) as {
      winner?: unknown;
      reasoning?: unknown;
      card1Ratings?: unknown;
      card2Ratings?: unknown;
    };

    const card1Ratings = parseRatingsStrict(parsed.card1Ratings, "Card A");
    const card2Ratings = parseRatingsStrict(parsed.card2Ratings, "Card B");
    const total1 = ratingsTotal(card1Ratings);
    const total2 = ratingsTotal(card2Ratings);

    // The ratings are the authoritative source of truth for fairness/consistency - the model's
    // own "winner" claim is only used to break an exact tie in the totals.
    let winner: "A" | "B";
    if (total1 !== total2) {
      winner = total1 > total2 ? "A" : "B";
    } else {
      const letter = typeof parsed.winner === "string" ? parsed.winner.trim().toUpperCase() : "";
      winner = letter === "A" || letter === "B" ? letter : Math.random() < 0.5 ? "A" : "B";
    }

    const reason =
      typeof parsed.reasoning === "string" && parsed.reasoning.trim()
        ? parsed.reasoning.trim()
        : "A closely fought round!";

    return { winner, reason, card1Ratings, card2Ratings };
  } catch (err) {
    // Should be rare now that the response is schema-constrained, but keep a safety net so one
    // bad response can't crash the round - and log the raw content so a recurring failure is
    // actually diagnosable instead of silently masked by a fake-looking flat fallback.
    console.error("judgeBattle: failed to parse judge response", err, content);
    const fallback: CardRatings = { art: 5, fame: 5, chase: 5, rarity: 5 };
    return {
      winner: Math.random() < 0.5 ? "A" : "B",
      reason: "The judge's notes got lost in the shuffle - too close to call!",
      card1Ratings: fallback,
      card2Ratings: fallback,
    };
  }
}
