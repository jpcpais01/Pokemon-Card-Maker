import type { SVGProps } from "react";

/**
 * Inline stroke-icon set for app chrome (navigation, buttons, affordances).
 *
 * Deliberately not emoji: emoji render as full-color glyphs that differ per
 * platform and instantly read as "web page" in a nav bar. These inherit
 * `currentColor` and line up on a 24px grid so they sit correctly next to text.
 * Emoji are still used for *content* - trait icons on card faces - where their
 * color and playfulness are the point.
 */

export type IconName =
  | "cards"
  | "swords"
  | "binder"
  | "star"
  | "star-filled"
  | "chevron-left"
  | "chevron-right"
  | "close"
  | "expand"
  | "download"
  | "reroll"
  | "sparkles"
  | "trophy"
  | "users"
  | "bot"
  | "check"
  | "share"
  | "plus"
  | "sound-on"
  | "sound-off";

interface Props extends SVGProps<SVGSVGElement> {
  name: IconName;
  /** Pixel size for both dimensions. Defaults to 24. */
  size?: number;
}

const PATHS: Record<IconName, React.ReactNode> = {
  cards: (
    <>
      <rect x="3" y="7" width="12" height="14" rx="2.5" />
      <path d="M8 4.5A2 2 0 0 1 10 3h6.5A2.5 2.5 0 0 1 19 5.5V17" />
    </>
  ),
  swords: (
    <>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <path d="m13 19 6-6" />
      <path d="m16 16 4 4" />
      <path d="m19 21 2-2" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <path d="m5 14 4 4" />
      <path d="m7 17-3 3" />
      <path d="m3 19 2 2" />
    </>
  ),
  binder: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 0 4 21z" />
      <path d="M4 5.5A2.5 2.5 0 0 0 6.5 8H20" />
    </>
  ),
  star: <path d="m12 3.5 2.6 5.7 6.2.7-4.6 4.2 1.2 6.1-5.4-3-5.4 3 1.2-6.1L3.2 9.9l6.2-.7z" />,
  "star-filled": (
    <path
      d="m12 3.5 2.6 5.7 6.2.7-4.6 4.2 1.2 6.1-5.4-3-5.4 3 1.2-6.1L3.2 9.9l6.2-.7z"
      fill="currentColor"
      stroke="none"
    />
  ),
  "chevron-left": <path d="m15 5-7 7 7 7" />,
  "chevron-right": <path d="m9 5 7 7-7 7" />,
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>
  ),
  expand: (
    <>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7.5 7.5" />
      <path d="M3 21l7.5-7.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4 20h16" />
    </>
  ),
  reroll: (
    <>
      <path d="M20 11.5A8 8 0 0 0 6.3 6.3L4 8.5" />
      <path d="M4 4.5v4h4" />
      <path d="M4 12.5a8 8 0 0 0 13.7 5.2L20 15.5" />
      <path d="M20 19.5v-4h-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
      <path d="m18.5 15.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5.5H4.5A1.5 1.5 0 0 0 3 7c0 2.2 1.8 4 4 4" />
      <path d="M17 5.5h2.5A1.5 1.5 0 0 1 21 7c0 2.2-1.8 4-4 4" />
      <path d="M12 14v3.5" />
      <path d="M8.5 21h7l-.8-3.5h-5.4z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6" />
      <path d="M18 14.5a6 6 0 0 1 3 5.5" />
    </>
  ),
  bot: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 4v4" />
      <circle cx="12" cy="3" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9.5 13.5v1.5" />
      <path d="M14.5 13.5v1.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  share: (
    <>
      <path d="M12 3v13" />
      <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
      <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  "sound-on": (
    <>
      <path d="M11 5 6.5 9H3v6h3.5L11 19z" />
      <path d="M15 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M17.8 6.7a7.5 7.5 0 0 1 0 10.6" />
    </>
  ),
  "sound-off": (
    <>
      <path d="M11 5 6.5 9H3v6h3.5L11 19z" />
      <path d="m16 10 5 4" />
      <path d="m21 10-5 4" />
    </>
  ),
};

export default function Icon({ name, size = 24, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
