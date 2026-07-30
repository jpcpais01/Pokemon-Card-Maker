# Pokemon Card Generator

A mobile-first web app that opens a random "pack" of four traits — art rarity,
special form, regional form, and a Pokemon pulled live from the Pokedex — then
uses AI to write an art-direction prompt and render a one-of-a-kind Pokemon
TCG-style illustration.

## How it works

1. **Pick generations.** Choose any combination of Gen I–IX to restrict which
   Pokemon can be pulled.
2. **Open the pack.** Four (or five, for Tag Team) cards are dealt face-down:
   Art Type, Special Form, Regional Form, and one Pokemon per slot. Each
   option is chosen with weighted randomness (some traits are common, some
   are rare) via `src/lib/cardData.ts`. Tap each card to flip it — picking
   **Tag Team** as the special form deals a second Pokemon card, and the
   rolled region applies to both.
3. **Generate the artwork.**
   - The selections are sent to `google/gemini-3.6-flash` (via
     [OpenRouter](https://openrouter.ai)), which writes a single detailed
     text-to-image prompt describing the illustration.
   - That prompt is sent to `google/gemini-3.1-flash-image` (also via
     OpenRouter) to render the final artwork, shown full-screen with a
     download button.

Pokemon names and artwork are fetched live from [PokeAPI](https://pokeapi.co)
(species-per-generation lookup + the official-artwork CDN) — no Pokemon data
is hardcoded.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your OpenRouter API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable              | Description                                                             |
| ---------------------- | ------------------------------------------------------------------------ |
| `OPENROUTER_API_KEY`   | Server-side only API key from [openrouter.ai/keys](https://openrouter.ai/keys). Never exposed to the client. |

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Add the `OPENROUTER_API_KEY` environment variable in the project settings.
4. Deploy — no other configuration required.

## Project structure

- `src/lib/cardData.ts` — weighted trait options (art type, special form, region).
- `src/lib/generations.ts` — generation metadata + live PokeAPI lookups.
- `src/lib/openrouter.ts` — server-side OpenRouter client for both models.
- `src/lib/promptBuilder.ts` — system prompt used to turn selections into an image prompt.
- `src/app/api/generate-prompt` — calls `google/gemini-3.6-flash` to draft the image prompt.
- `src/app/api/generate-image` — calls `google/gemini-3.1-flash-image` to render the artwork.
- `src/components/` — the pack-opening UI (generation picker, flip cards, loading/result/error screens).
