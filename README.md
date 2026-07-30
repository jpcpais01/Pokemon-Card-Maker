# Pokemon Card Generator

A mobile-first web app that opens a random "pack" of four traits — art rarity,
special form, regional form, and a Pokemon pulled live from the Pokedex — then
uses AI to write an art-direction prompt and render a one-of-a-kind Pokemon
TCG-style illustration. Includes a 1v1 Battle mode where two players open
packs and an AI judge scores each round.

## How it works (solo mode)

1. **Pick generations.** Choose any combination of Gen I–IX to restrict which
   Pokemon can be pulled.
2. **Open the pack.** Four (or five, for Tag Team) cards are dealt face-down:
   Art Type, Special Form, Regional Form, and one Pokemon per slot. Each
   option is chosen with weighted randomness (some traits are common, some
   are rare) via `src/lib/cardData.ts`. Tap each card to flip it — picking
   **Tag Team** as the special form deals a second Pokemon card, and the
   rolled region applies to both. You get 5 rerolls per pack, usable on any
   card in any combination.
3. **Generate the artwork.**
   - The selections are sent to `google/gemini-3.6-flash` (via
     [OpenRouter](https://openrouter.ai)), which writes a single detailed
     text-to-image prompt describing the illustration.
   - That prompt is sent to `google/gemini-3.1-flash-image` (also via
     OpenRouter) to render the final 3:4 artwork, shown full-screen with a
     tap-to-zoom lightbox and a download button.

Pokemon names and artwork are fetched live from [PokeAPI](https://pokeapi.co)
(species-per-generation lookup + the official-artwork CDN) — no Pokemon data
is hardcoded.

## 1v1 Battle mode

At `/battle`, one player creates a room (picking the generations for the
match) and shares the 6-character code or invite link with a friend. Once
both are in:

- Both players open a pack **at the same time**, independently — you can't
  see your opponent's picks until the round is revealed.
- Each player gets 5 rerolls **for the whole match** (not per round) —
  unused rerolls carry over into later rounds.
- Once both lock in their picks, the server drafts a prompt and generates
  artwork for both players, then sends **both images plus each Pokemon's
  name** to `google/gemini-3.6-flash`, which picks a winner and gives a
  one-line verdict.
- The round winner gets a point. After **5 rounds**, whoever has more points
  wins the match.

Battle mode needs a small key-value store (Redis) to hold room/match state
across requests — see the environment variables section below.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your OpenRouter API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Battle mode works out of
the box in local dev via an in-memory fallback store (no Redis needed to try
it locally in one browser/tab pair).

### Environment variables

| Variable                     | Required for      | Description                                                                                                     |
| ----------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `OPENROUTER_API_KEY`          | Everything          | Server-side only API key from [openrouter.ai/keys](https://openrouter.ai/keys). Never exposed to the client.      |
| `UPSTASH_REDIS_REST_URL`      | Battle mode (prod)  | REST URL from a free [Upstash](https://upstash.com) Redis database (or Vercel's Upstash marketplace integration). |
| `UPSTASH_REDIS_REST_TOKEN`    | Battle mode (prod)  | REST token for the same database.                                                                                  |

Without the Upstash variables, battle mode still runs using an in-memory
store — fine for local development, but **it will not work correctly once
deployed to Vercel** (serverless functions don't share memory across
instances). Add a Redis database before relying on battle mode in production.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Add the `OPENROUTER_API_KEY` environment variable in the project settings.
4. For battle mode, also add a Redis database (Vercel's Storage tab → connect
   an Upstash for Redis integration, or create one directly at
   [upstash.com](https://upstash.com)) and set `UPSTASH_REDIS_REST_URL` /
   `UPSTASH_REDIS_REST_TOKEN`.
5. Deploy.

## Project structure

- `src/lib/cardData.ts` — weighted trait options (art type, special form, region).
- `src/lib/generations.ts` — generation metadata + live PokeAPI lookups.
- `src/lib/cardFaces.tsx` — shared FlipCard front-face builder used by both solo and battle mode.
- `src/lib/openrouter.ts` — server-side OpenRouter client (prompt drafting, image generation, battle judging).
- `src/lib/promptBuilder.ts` — system prompts used to turn selections into an image prompt, and to judge battles.
- `src/lib/battle/` — battle mode: room/round types, the Redis-or-memory store, roll/reroll engine, room accessors.
- `src/app/api/generate-prompt`, `src/app/api/generate-image` — solo mode generation endpoints.
- `src/app/api/battle/*` — battle mode endpoints (create/join/state/reroll/lock/advance/ready/image).
- `src/app/battle/`, `src/components/battle/` — battle mode UI (lobby, waiting room, pick panel, round/match results).
- `src/components/` — shared pack-opening UI (generation picker, flip cards, loading/result/error screens).
