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

/** Strips ```json fences some models wrap JSON in despite instructions not to. */
function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1] : trimmed;
}

function clampRating(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(1, Math.round(n)));
}

function parseRatings(raw: unknown): CardRatings {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
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

export async function judgeBattle(
  systemPrompt: string,
  imageA: string,
  namesA: string,
  imageB: string,
  namesB: string
): Promise<BattleJudgement> {
  const data = await callOpenRouter({
    model: TEXT_MODEL,
    messages: [
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
    ],
    temperature: 0.6,
    max_tokens: 300,
  });

  const content = data?.choices?.[0]?.message?.content;
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

    const card1Ratings = parseRatings(parsed.card1Ratings);
    const card2Ratings = parseRatings(parsed.card2Ratings);
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
  } catch {
    const fallback: CardRatings = { art: 5, fame: 5, chase: 5, rarity: 5 };
    return {
      winner: Math.random() < 0.5 ? "A" : "B",
      reason: "A closely fought round!",
      card1Ratings: fallback,
      card2Ratings: fallback,
    };
  }
}
