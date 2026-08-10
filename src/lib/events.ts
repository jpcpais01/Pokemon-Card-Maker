import {
  BADDIES_GEN_ID,
  POOL_PARTY_GEN_ID,
  PORTUGAL_GEN_ID,
  TOP_100_GEN_ID,
  WEED_GEN_ID,
} from "./generations";

/**
 * An "event" is a theme layered on top of a normal game, not a replacement for
 * one. Picking an event doesn't take anything away: you still choose how to
 * play (solo / vs bot / vs friend), which pack mode to run, and which pools to
 * pull from. All it does is steer the artwork - and, in battle, tell the judge
 * what the match is going for.
 */
export type EventTheme = "pool-party" | "baddies" | "weed" | "eclipse" | "portuguese-culture";

export interface EventDef {
  slug: EventTheme;
  label: string;
  /** One-liner under the title on the carousel card. */
  tagline: string;
  /** Longer description on the event's own hub screen. */
  blurb: string;
  /** Small badge on the carousel card, e.g. a seasonal marker. */
  badge?: string;
  /**
   * `YYYY-MM-DD` of the event's last playable day, inclusive. Omit for an evergreen
   * event. Once past, it drops off the home shelf and its hub stops handing off into
   * a game. See `isEventLive` for why the comparison is deliberately client-side.
   */
  availableUntil?: string;
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

/**
 * The game with no event layered on it.
 *
 * Deliberately not in EVENTS - it has no art direction, no pool of its own and never expires,
 * so nothing that iterates events should pick it up. It carries the same identity fields
 * because it is otherwise a mode like any other: it sits on the same shelf and opens the same
 * hub, and the only difference is that it leaves the artwork alone.
 */
export const BASE_MODE = {
  label: "Classic Pack",
  tagline: "Four random traits, one AI-painted card",
  blurb:
    "The game with nothing layered on top - four random traits and whatever the AI paints from them. Play it however you like: solo, against bots, or against a friend, in any pack mode.",
  image: "/modes/classic.jpg",
  gradient: "linear-gradient(150deg, #fbbf24 0%, #ea7c0b 45%, #4a1d05 100%)",
};

export const EVENTS: EventDef[] = [
  {
    slug: "eclipse",
    label: "Eclipse",
    tagline: "Limited time — totality over every card",
    blurb:
      "For a few days only, every card falls under a total solar eclipse. Play it however you like - solo, against bots, or against a friend, in any pack mode. Only the artwork changes.",
    badge: "Limited time",
    availableUntil: "2026-08-15",
    defaultGens: [TOP_100_GEN_ID],
    promptDirection:
      'Event theme - "Eclipse": stage this illustration around a total solar eclipse. The eclipse itself should be a real presence in the scene, not a detail tucked in a corner - the blacked-out sun ringed by a blazing white corona, the sky dropped to deep twilight blue and violet mid-day, the horizon still glowing sunset-orange the whole way around, stars coming out early. Work in what that light does to everything below it: long strange shadows, crescent-shaped light dappling the ground, rim-lighting that traces every silhouette in white-gold fire, an eerie hushed stillness. The Pokemon should be reacting to the moment - awed, watching, silhouetted against the corona, or lit from behind by that ring of fire. This theme sets the scene and lighting; keep the vibe, special form and rarity tier driving the mood, action and rendering as they normally would.',
    styleDirection:
      " This is an Eclipse event card - the entire scene plays out under a total solar eclipse: a black sun ringed by a blazing white corona high in the frame, deep twilight-violet sky, a 360-degree sunset glow on the horizon, dramatic backlit silhouettes and white-gold rim light on everything, with an awed hush over the whole composition. Keep every Pokemon's official design, proportions and colors completely accurate.",
    judgeContext:
      'This match is an "Eclipse" event - every card is aiming for a dramatic total-solar-eclipse scene: the corona, the twilight sky, and the strange backlit rim-lighting it throws over everything. Factor in how well each illustration actually commits to that moment and uses the eclipse light, alongside its normal artistic merit.',
    image: "/modes/eclipse.jpg",
    // Two layers, because a single radial gradient can only make a glowing sun - an
    // eclipse needs the hole. The first paints the moon's black disc and goes fully
    // transparent just past its edge; the second is the corona burning out from exactly
    // where that disc ends, through the twilight sky. Sits under the artwork above,
    // and stands in for it while it loads or if it ever goes missing.
    gradient:
      "radial-gradient(circle at 50% 35%, #05040c 0 12%, rgba(5,4,12,0) 12.5%), radial-gradient(circle at 50% 35%, #fffdf2 12.2%, #ffeab0 14%, #ffb43c 17.5%, #c2510f 23%, #4b1d5e 44%, #170b2f 70%, #05040f 100%)",
    accent: "text-amber-200",
  },
  {
    slug: "portuguese-culture",
    label: "Portuguese Culture",
    tagline: "Azulejos, the Atlantic and a bit of saudade",
    blurb:
      "Every card is set somewhere in Portugal - the tiled streets, the fishing coast, a festa at night. Play it however you like: solo, against bots, or against a friend, in any pack mode. Only the artwork changes.",
    defaultGens: [PORTUGAL_GEN_ID],
    // Named specifics rather than "make it Portuguese": a drafting model handed a country
    // reaches for the same three postcard clichés every time, and the point of the pool is
    // that each card already has a concrete hook to build on.
    promptDirection:
      'Event theme - "Portuguese Culture": set this illustration somewhere unmistakably Portuguese, and commit to the details. Draw on the real visual language of the country wherever it fits the card - blue-and-white azulejo tilework climbing a wall, black-and-white calçada portuguesa mosaic paving underfoot, terracotta rooftops stacked down a hillside, narrow streets strung with laundry lines and paper festa garlands, ornate Manueline stonework carved with rope and armillary spheres, wooden fishing boats and caravels, a whitewashed lighthouse on an Atlantic cliff, sardines grilling over coals, ceramic swallows on a wall, the painted Galo de Barcelos rooster, a Portuguese guitar and a fado singer in the lamplight, cork oaks and golden Alentejo plains, port wine cellars, cobbled squares and tiled train stations. Warm Atlantic light, deep ocean blues, whitewash, terracotta and gold. There should be a touch of saudade about it - a warmth with something wistful underneath. This theme sets the scene; keep the vibe, special form and rarity tier driving the mood, action and rendering as they normally would.',
    styleDirection:
      " This is a Portuguese Culture event card - the whole scene is set in Portugal: blue-and-white azulejo tiling, black-and-white calçada mosaic paving, terracotta rooftops, whitewashed walls, Atlantic sea light and coastal cliffs, with warm gold, deep blue and terracotta throughout. Keep every Pokemon's official design, proportions and colors completely accurate.",
    judgeContext:
      'This match is a "Portuguese Culture" event - every card is aiming to be set unmistakably in Portugal: azulejo tilework, calçada paving, terracotta rooftops, the Atlantic coast, festa and fado imagery, and that warm light with a wistful edge. Factor in how specifically and convincingly each illustration commits to that setting, rather than a generic seaside town, alongside its normal artistic merit.',
    image: "/modes/portuguese-culture.jpg",
    // Layered rather than a plain fade, because a blue gradient on its own says nothing about
    // Portugal. The two crossed repeating gradients draw an azulejo diamond lattice, the
    // radial puts warm Atlantic sun in the corner so it isn't flatly monochrome, and the base
    // runs whitewash down into deep ocean. Sits under the artwork above, covering the load.
    gradient:
      "repeating-linear-gradient(45deg, rgba(23,58,110,.32) 0 2px, transparent 2px 24px), repeating-linear-gradient(-45deg, rgba(23,58,110,.32) 0 2px, transparent 2px 24px), radial-gradient(circle at 78% 12%, rgba(255,214,140,.85) 0%, rgba(255,180,90,.35) 12%, transparent 34%), linear-gradient(150deg, #eef4fb 0%, #9dc0e3 20%, #3f7cbd 46%, #1c4a86 70%, #0a1f3d 100%)",
    accent: "text-sky-200",
  },
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
  {
    slug: "weed",
    label: "Weed",
    tagline: "Hazy, psychedelic, permanently chill",
    blurb:
      "Every card gets hazy, trippy and deeply chilled out. Play it however you like - solo, against bots, or against a friend, in any pack mode. Only the artwork changes.",
    badge: "420",
    defaultGens: [WEED_GEN_ID],
    // Written as an atmosphere rather than as anyone consuming anything: it's the
    // look people actually want from this, it keeps the Pokemon in character, and
    // it sails past the image model's content filter instead of tripping it and
    // failing the generation outright.
    promptDirection:
      'Event theme - "Weed": build the whole scene around a warm, blissed-out, psychedelic haze. Work in the trappings wherever they fit naturally - thick smoke drifting and curling through the air, fat sunbeams cutting through it, kaleidoscopic melting color, swirling tie-dye and lava-lamp blobs, big serrated cannabis-leaf shapes woven through the foliage, hanging string lights, curling incense, beanbags and floor cushions, scattered snack piles. The Pokemon should look deeply, contentedly relaxed - heavy-lidded eyes, a lazy grin, sprawled out and completely unbothered. This theme sets the scene and mood; keep the vibe, special form and rarity tier driving the action and rendering as they normally would.',
    styleDirection:
      " This is a Weed event card - the whole scene is bathed in a warm psychedelic haze: thick drifting smoke, kaleidoscopic swirling melted color, serrated cannabis-leaf foliage, and a deeply blissed-out, heavy-lidded, unbothered mood throughout. Keep every Pokemon's official design, proportions and colors completely accurate.",
    // Named as an aesthetic rather than as the event, for the same reason `promptDirection`
    // above is: this one is handed to the judge *together with the finished artwork*, and a
    // vision request that pairs those images with an explicit drug reference gets refused
    // outright - an empty response, which costs the round its ratings and its score bars.
    // The look is what the judge has to grade anyway; the label adds nothing.
    judgeContext:
      "Every card in this match is going for the same look: a warm psychedelic haze - thick drifting smoke, kaleidoscopic melted color, lava-lamp swirls, and a deeply relaxed, heavy-lidded, unbothered mood. Factor in how well each illustration actually commits to that atmosphere, alongside its normal artistic merit.",
    image: "/modes/weed.jpg",
    gradient: "linear-gradient(150deg, #a3e635 0%, #4d7c0f 42%, #2e1065 100%)",
    accent: "text-lime-200",
  },
];

const DAY_MS = 86_400_000;

/** Midnight at the end of `availableUntil`, in the viewer's own timezone. */
function expiryTime(event: EventDef): number | null {
  if (!event.availableUntil) return null;
  const [y, m, d] = event.availableUntil.split("-").map(Number);
  // `d + 1` rolls the month/year over on its own, so the last day stays playable in full.
  return new Date(y, m - 1, d + 1).getTime();
}

/**
 * Whether an event is still running.
 *
 * Callers must pass the current time rather than let this read the clock, and that is the
 * whole point: the home shelf and the event hubs are statically prerendered, so reading
 * `Date.now()` during render would bake the *build* date into HTML that then gets served
 * for weeks. Both callers get `now` from `useHydrated`, which is null until the browser
 * takes over - so the markup never claims an expiry it can't know yet.
 */
export function isEventLive(event: EventDef, now: number): boolean {
  const end = expiryTime(event);
  return end === null || now < end;
}

/**
 * The badge for a time-limited event, counting down once it's close. `now` is null before
 * hydration, where the static `badge` is the only honest thing to show.
 */
export function eventBadge(
  event: EventDef,
  now: number | null,
): string | undefined {
  const end = expiryTime(event);
  if (end === null || now === null) return event.badge;
  if (now >= end) return "Ended";
  const daysLeft = Math.ceil((end - now) / DAY_MS);
  if (daysLeft === 1) return "Last day";
  if (daysLeft <= 7) return `${daysLeft} days left`;
  return event.badge;
}

export function getEvent(
  slug: string | null | undefined,
): EventDef | undefined {
  if (!slug) return undefined;
  return EVENTS.find((e) => e.slug === slug);
}

/** Narrows an arbitrary string (query param, request body) to a known theme. */
export function parseEventTheme(
  value: string | null | undefined,
): EventTheme | undefined {
  return getEvent(value)?.slug;
}
