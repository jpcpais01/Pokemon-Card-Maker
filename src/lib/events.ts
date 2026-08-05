import { BADDIES_GEN_ID, POOL_PARTY_GEN_ID } from "./generations";

/**
 * An "event" is a theme layered on top of a normal game, not a replacement for
 * one. Picking an event doesn't take anything away: you still choose how to
 * play (solo / vs bot / vs friend), which pack mode to run, and which pools to
 * pull from. All it does is steer the artwork - and, in battle, tell the judge
 * what the match is going for.
 */
export type EventTheme = "pool-party" | "baddies";

export interface EventDef {
  slug: EventTheme;
  label: string;
  /** One-liner under the title on the carousel card. */
  tagline: string;
  /** Longer description on the event's own hub screen. */
  blurb: string;
  /** Small badge on the carousel card, e.g. a seasonal marker. */
  badge?: string;
  /** Pools preselected when you enter this event's setup. */
  defaultGens: number[];
  /** Extra art direction handed to the drafting model alongside the traits. */
  promptDirection: string;
  /**
   * Guaranteed reinforcement appended in code to the image prompt. The drafting
   * model can underplay a theme; this makes sure it still reaches the image model.
   */
  styleDirection: string;
  /** Context given to the battle AI judge so it knows what the round is aiming for. */
  judgeContext: string;
  /**
   * Background art for the carousel card and event hero, dropped into
   * `public/modes/`. Missing files simply fall through to `gradient` below,
   * so the UI looks finished before the art exists.
   */
  image: string;
  /** Fallback (and underlay) gradient for the card background. */
  gradient: string;
  /** Tailwind text tone for the badge/accent on this event's card. */
  accent: string;
}

export const EVENTS: EventDef[] = [
  {
    slug: "pool-party",
    label: "Pool Party!",
    tagline: "Special August event",
    blurb:
      "Every card becomes a summer pool party. Play it however you like - solo, against bots, or against a friend, in any pack mode. Only the artwork changes.",
    badge: "August Event",
    defaultGens: [POOL_PARTY_GEN_ID],
    promptDirection:
      'Event theme - "Pool Party": set this illustration at a bright, joyful summer pool party. Work in the trappings of one wherever they fit naturally - sparkling turquoise water, inflatable floats and beach balls, poolside tiles and loungers, sunglasses, splashing, tropical drinks, palm shade, string lights or confetti, hot summer sunlight. The Pokemon should be actively enjoying the party rather than merely standing near a pool. This theme sets the scene; keep the vibe, special form and rarity tier driving the mood, action and rendering as they normally would.',
    styleDirection:
      " This is a Pool Party event card - the entire scene is set at a lively summer pool party: sparkling turquoise water, inflatable floats, poolside tiles, bright hot sunlight and a celebratory summer atmosphere, with the Pokemon joining in. Keep every Pokemon's official design, proportions and colors completely accurate.",
    judgeContext:
      'This match is a "Pool Party" event - every card is aiming for a bright, fun summer pool-party scene. Factor in how well each illustration actually commits to that setting and sells the summer energy, alongside its normal artistic merit.',
    image: "/modes/pool-party.jpg",
    gradient: "linear-gradient(150deg, #22d3ee 0%, #0891b2 45%, #0e3a5c 100%)",
    accent: "text-cyan-200",
  },
  {
    slug: "baddies",
    label: "Baddies",
    tagline: "Glamour, charm and confidence",
    blurb:
      "Every card leans girly, cute and glamorous. Play it however you like - solo, against bots, or against a friend, in any pack mode. Only the artwork changes.",
    defaultGens: [BADDIES_GEN_ID],
    promptDirection:
      "Event theme - \"Baddies\": compose this as a girly, cute, glamorous baddie card - a confident, alluring, fashion-forward take on the Pokemon (flattering pose, soft glam lighting, stylish charm) while still keeping its official design, proportions and colors completely accurate.",
    styleDirection:
      " This is a Baddies event card - lean the whole composition girly, cute, glamorous and alluring: a confident, flattering pose and soft glam styling, while keeping every Pokemon's official design and proportions completely accurate.",
    judgeContext:
      'This match is a "Baddies" event - every card is aiming for a girly, cute, glamorous, alluring look. Factor in how well each illustration actually nails that confident, stylish, eye-catching charm when you judge, especially for fame and chase.',
    image: "/modes/baddies.jpg",
    gradient: "linear-gradient(150deg, #f472b6 0%, #be185d 45%, #3b0a2a 100%)",
    accent: "text-pink-200",
  },
];

export function getEvent(slug: string | null | undefined): EventDef | undefined {
  if (!slug) return undefined;
  return EVENTS.find((e) => e.slug === slug);
}

/** Narrows an arbitrary string (query param, request body) to a known theme. */
export function parseEventTheme(value: string | null | undefined): EventTheme | undefined {
  return getEvent(value)?.slug;
}
