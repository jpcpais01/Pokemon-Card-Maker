# Mode / event card art

Background images for the home carousel cards and the event hero screens.

| File             | Used by                       |
| ---------------- | ----------------------------- |
| `classic.jpg`    | Classic Pack card             |
| `pool-party.jpg` | Pool Party! event card + hero |
| `baddies.jpg`    | Baddies event card + hero     |
| `weed.jpg`       | Weed event card + hero        |
| `eclipse.jpg`    | Eclipse event card + hero     |
| `portuguese-culture.jpg` | Portuguese Culture event card + hero |
| `rick-and-morty.jpg` | Rick and Morty event card + hero |

To swap one out, keep the filename (including the extension), or update
`image` in `src/lib/events.ts` / `FEATURED` in `src/app/page.tsx` to match.

Sizing:
- Landscape, roughly 4:3. The current set is 1200x896.
- Carousel cards render near 6:5 and the event hero near 2:1, both cropped
  with `background-size: cover`, so keep the subject centred - the hero
  trims top and bottom, the card trims the sides.
- A dark scrim covers the lower part of both for the title and button, so
  avoid putting anything you need readable down there.

If a file is missing the card falls back to its gradient, so the UI still
looks finished.
