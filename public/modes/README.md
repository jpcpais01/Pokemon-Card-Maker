# Mode / event card art

Drop background images here to replace the placeholder gradients on the home
carousel and event hero. Expected filenames:

| File              | Used by                        |
| ----------------- | ------------------------------ |
| `classic.jpg`     | Classic Pack card              |
| `pool-party.jpg`  | Pool Party! event card + hero  |
| `baddies.jpg`     | Baddies event card + hero      |

Notes:
- Any web format works — just keep the filename (including the extension) as
  listed above, or update `image` in `src/lib/events.ts` / `FEATURED` in
  `src/app/page.tsx` to match.
- Cards render at roughly a 4:5 portrait ratio and are cropped with
  `background-size: cover`, so keep the subject near the middle. ~800x1000px
  or larger looks good on high-DPI screens.
- A dark scrim is drawn over the bottom half for the title, so images with
  busy bottoms still read fine.
- Until a file exists the card falls back to its gradient, so the UI never
  looks broken.
