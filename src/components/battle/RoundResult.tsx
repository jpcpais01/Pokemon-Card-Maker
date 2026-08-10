"use client";

import { useCallback, useEffect, useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";
import TraitChip from "@/components/TraitChip";
import Icon from "@/components/ui/Icon";
import { MAJOR_TIER_MARKS, ratingsTier, ratingsTotal, tierForTotal } from "@/lib/battle/tier";
import type { BattleRound, BattleRoundPlayerState, CardRatings } from "@/lib/battle/types";
import { useFavoriteToggle } from "@/lib/favorites";

const COMPARE_MS = 15000;
const BREAKDOWN_MS = 7000;
const VICTORY_SPOTLIGHT_MS = 4000;

/**
 * Every player gets their own spotlight beat before the bars, so the total is this times the
 * table size - at ten players a flat 3s meant half a minute of card-by-card before anything
 * was decided. Big tables get a quicker cut so the whole reveal stays roughly constant.
 */
function cardSpotlightMs(playerCount: number): number {
  if (playerCount <= 4) return 3000;
  return playerCount <= 6 ? 2200 : 1500;
}

export interface RoundResultPlayerInfo {
  id: string;
  /** "You" is handled by the caller via isMe - this is only used for non-self players. */
  label: string;
  image: string | null;
  pick: BattleRoundPlayerState;
  ratings?: CardRatings;
  isMe: boolean;
}

interface Props {
  round: BattleRound;
  /** Ordered with "me" first, then every other player in a stable order. 2 to MAX_PLAYERS entries. */
  players: RoundResultPlayerInfo[];
  isLastRound: boolean;
  myReady: boolean;
  allOthersReady: boolean;
  readyBusy: boolean;
  onReady: () => void;
}

export default function RoundResult({
  round,
  players,
  isLastRound,
  myReady,
  allOthersReady,
  readyBusy,
  onReady,
}: Props) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [fullView, setFullView] = useState<{ src: string; prompt?: string; pick: BattleRoundPlayerState } | null>(
    null
  );
  const favoriteCardInfo = fullView
    ? {
        prompt: fullView.prompt,
        pokemonNames: fullView.pick.pokemons.map((p) => p.displayName).join(" & "),
        artType: fullView.pick.artType.label,
        specialForm: fullView.pick.specialForm.value !== "none" ? fullView.pick.specialForm.label : undefined,
        vibe: fullView.pick.vibe.label,
      }
    : null;
  const { isFavorited, toggle: toggleFavorite, error: favoriteError } = useFavoriteToggle(
    fullView?.src ?? null,
    favoriteCardInfo
  );

  const n = players.length;
  const COMPARE_PHASE = n;
  // The bars answer "who won"; this one answers "on what". It sits between them and the
  // victory spotlight so the win is explained before it's celebrated.
  const BREAKDOWN_PHASE = n + 1;
  const VICTORY_PHASE = n + 2;
  const SUMMARY_PHASE = n + 3;

  const allImagesReady = players.every((p) => !!p.image);
  // Only worth a dedicated bars-comparison beat when the judge actually produced ratings -
  // a coin-flip/default-win round has none, so it skips straight to the victory spotlight.
  const hasRatings = !!round.ratings;

  const advancePhase = useCallback(() => {
    setPhaseIndex((p) => {
      if (p < n - 1) return p + 1;
      if (p === n - 1) return hasRatings ? COMPARE_PHASE : VICTORY_PHASE;
      if (p === COMPARE_PHASE) return BREAKDOWN_PHASE;
      if (p === BREAKDOWN_PHASE) return VICTORY_PHASE;
      return SUMMARY_PHASE;
    });
  }, [n, hasRatings, COMPARE_PHASE, BREAKDOWN_PHASE, VICTORY_PHASE, SUMMARY_PHASE]);

  useEffect(() => {
    if (phaseIndex === SUMMARY_PHASE || !allImagesReady) return;
    const duration =
      phaseIndex === VICTORY_PHASE
        ? VICTORY_SPOTLIGHT_MS
        : phaseIndex === COMPARE_PHASE
          ? COMPARE_MS
          : phaseIndex === BREAKDOWN_PHASE
            ? BREAKDOWN_MS
            : cardSpotlightMs(n);
    const timer = window.setTimeout(advancePhase, duration);
    return () => window.clearTimeout(timer);
  }, [phaseIndex, allImagesReady, advancePhase, n, SUMMARY_PHASE, VICTORY_PHASE, COMPARE_PHASE, BREAKDOWN_PHASE]);

  if (phaseIndex === COMPARE_PHASE) {
    return <RatingsBattle players={players} onSkip={advancePhase} />;
  }

  // Must come before the spotlight branch below, which indexes players by phase.
  if (phaseIndex === BREAKDOWN_PHASE) {
    return <RatingsBreakdown players={players} onSkip={advancePhase} />;
  }

  const winnerPlayer = players.find((p) => p.id === round.winnerId);

  if (phaseIndex < SUMMARY_PHASE) {
    const isVictory = phaseIndex === VICTORY_PHASE;
    const spotlightPlayer = isVictory ? (winnerPlayer ?? players[0]) : players[phaseIndex];

    return (
      <CardSpotlight
        phaseKey={phaseIndex}
        isVictory={isVictory}
        label={spotlightPlayer.isMe ? "You" : spotlightPlayer.label}
        pick={spotlightPlayer.pick}
        image={spotlightPlayer.image}
        loading={!allImagesReady}
        verdict={round.verdict}
        ratings={isVictory ? spotlightPlayer.ratings : undefined}
        onSkip={advancePhase}
      />
    );
  }

  const iWon = winnerPlayer?.isMe ?? false;

  return (
    <div>
      <p className="text-center text-sm font-bold text-amber-300">
        {iWon ? "🏆 You won this round!" : `This round goes to ${winnerPlayer?.label ?? "someone else"}.`}
      </p>

      <div className={`mt-4 grid gap-3 ${players.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {players.map((p) => (
          <ResultCard
            key={p.id}
            label={p.isMe ? "You" : p.label}
            pick={p.pick}
            image={p.image}
            winner={p.id === round.winnerId}
            ratings={p.ratings}
            onOpenFullView={(src, prompt) => setFullView({ src, prompt, pick: p.pick })}
          />
        ))}
      </div>

      {round.verdict && (
        <p className="card mt-4 p-3.5 text-center text-[12px] italic leading-relaxed text-slate-300">
          &ldquo;{round.verdict}&rdquo;
        </p>
      )}

      <button
        type="button"
        onClick={onReady}
        disabled={myReady || readyBusy}
        className="btn-primary mt-6 w-full disabled:opacity-50"
      >
        {myReady
          ? allOthersReady
            ? "Continuing..."
            : "Waiting for others..."
          : isLastRound
            ? "See Final Results"
            : "Next Round"}
      </button>

      {fullView && (
        <ImageLightbox
          src={fullView.src}
          alt="Full size artwork"
          onClose={() => setFullView(null)}
          holo={fullView.pick.artType.label === "Special Illustration Rare"}
          isFavorited={isFavorited}
          onToggleFavorite={toggleFavorite}
          favoriteError={favoriteError}
        />
      )}
    </div>
  );
}

function CardSpotlight({
  phaseKey,
  isVictory,
  label,
  pick,
  image,
  loading,
  verdict,
  ratings,
  onSkip,
}: {
  phaseKey: number;
  isVictory: boolean;
  label: string;
  pick: BattleRoundPlayerState;
  image: string | null;
  loading: boolean;
  verdict?: string;
  ratings?: CardRatings;
  onSkip: () => void;
}) {
  const name = pick.pokemons.map((p) => p.displayName).join(" & ");

  return (
    <div
      onClick={onSkip}
      className="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center gap-5 bg-[#07070c] px-6 py-10"
    >
      <div key={phaseKey} className="spotlight-in flex w-full flex-col items-center gap-5">
        {isVictory ? (
          <p className="text-lg font-black text-amber-300">🏆 Winner!</p>
        ) : (
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">{label}</p>
        )}

        <div
          className={`relative aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-3xl border-2 ${
            isVictory
              ? "victory-pulse border-amber-300 shadow-[0_0_60px_-8px_rgba(251,191,36,0.7)]"
              : "border-white/15 shadow-2xl shadow-black/50"
          }`}
        >
          {image && !loading ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-black/30 text-xs text-slate-500">
              Loading...
            </div>
          )}
        </div>

        <div className="text-center">
          {isVictory && (
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300/80">{label}</p>
          )}
          <p className="font-display mt-1 text-2xl font-extrabold text-white">{name}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <TraitChip tone="gold">{pick.artType.label}</TraitChip>
            {pick.specialForm.value !== "none" && <TraitChip tone="violet">{pick.specialForm.label}</TraitChip>}
            <TraitChip tone="teal">{pick.vibe.label}</TraitChip>
          </div>
        </div>

        {isVictory && verdict && (
          <p className="card max-w-xs p-3.5 text-center text-[12px] italic leading-relaxed text-slate-300">
            &ldquo;{verdict}&rdquo;
          </p>
        )}

        {isVictory && ratings && <TierBadge tier={ratingsTier(ratings)} size="large" />}
      </div>

      <p className="text-[11px] font-semibold text-slate-600">Tap to skip →</p>
    </div>
  );
}

// Reference duration for growing from 0 to the theoretical max total (4 categories x 10) - every
// bar shares this exact rate, so they rise together and whichever total is lower simply stops
// first while the others keep climbing until they reach their own value.
const MAX_RATINGS_TOTAL = 40;
const BAR_GROW_MS = 13200;
const BAR_GROW_START_DELAY = 200;
const POST_SETTLE_PAUSE_MS = 1000;

interface BarAccent {
  grad: string;
  border: string;
  text: string;
  glow: string;
}

/** One per player column, and there must be at least MAX_PLAYERS of them - the columns
 *  stand side by side, so two players sharing an accent would be genuinely ambiguous. */
const BAR_ACCENTS: BarAccent[] = [
  { grad: "from-amber-600 via-amber-400 to-yellow-200", border: "border-amber-300", text: "text-amber-300", glow: "rgba(251,191,36,0.75)" },
  { grad: "from-violet-700 via-fuchsia-500 to-cyan-300", border: "border-fuchsia-300", text: "text-fuchsia-300", glow: "rgba(217,70,239,0.75)" },
  { grad: "from-emerald-700 via-emerald-400 to-teal-200", border: "border-emerald-300", text: "text-emerald-300", glow: "rgba(16,185,129,0.75)" },
  { grad: "from-sky-700 via-sky-400 to-blue-200", border: "border-sky-300", text: "text-sky-300", glow: "rgba(56,189,248,0.75)" },
  { grad: "from-rose-700 via-rose-500 to-orange-200", border: "border-rose-300", text: "text-rose-300", glow: "rgba(244,63,94,0.75)" },
  { grad: "from-lime-700 via-lime-400 to-yellow-200", border: "border-lime-300", text: "text-lime-300", glow: "rgba(163,230,53,0.75)" },
  { grad: "from-indigo-700 via-indigo-400 to-sky-200", border: "border-indigo-300", text: "text-indigo-300", glow: "rgba(129,140,248,0.75)" },
  { grad: "from-orange-700 via-orange-400 to-amber-200", border: "border-orange-300", text: "text-orange-300", glow: "rgba(251,146,60,0.75)" },
  { grad: "from-teal-700 via-teal-400 to-emerald-200", border: "border-teal-300", text: "text-teal-300", glow: "rgba(45,212,191,0.75)" },
  { grad: "from-pink-700 via-pink-400 to-rose-200", border: "border-pink-300", text: "text-pink-300", glow: "rgba(244,114,182,0.75)" },
];

/**
 * Column metrics per table size. The pixel values have to agree with the Tailwind classes
 * next to them: the image marker is positioned in px so it can be clamped inside the track,
 * so the two are only correct together - keeping them in one row each is what stops them
 * drifting apart.
 *
 * `wide` exists because six columns don't fit at `group`'s dimensions: they'd be about 50px
 * apiece on a phone, narrower than the 56px marker sitting in them. `xwide` goes further and
 * stops trying to fit one row at all - see `container`.
 */
const BAR_SIZES = {
  duo: {
    column: "min-w-0 flex-1",
    container: "max-w-sm gap-5",
    track: "h-[26rem] max-w-[8rem]",
    trackPx: 416,
    marker: "h-24 w-24",
    markerPx: 96,
    label: "text-[11px]",
    total: "text-[2.4rem]",
  },
  group: {
    column: "min-w-0 flex-1",
    container: "max-w-sm gap-2.5",
    track: "h-64 max-w-[5rem]",
    trackPx: 256,
    marker: "h-14 w-14",
    markerPx: 56,
    label: "text-[9px]",
    total: "text-[1.6rem]",
  },
  wide: {
    column: "min-w-0 flex-1",
    container: "max-w-sm gap-1.5",
    track: "h-56 max-w-[3.25rem]",
    trackPx: 224,
    marker: "h-10 w-10",
    markerPx: 40,
    label: "text-[8px]",
    total: "text-[1.15rem]",
  },
  xwide: {
    // Fixed-width columns and a container deliberately too narrow for a sixth, so seven to ten
    // players wrap onto two centred rows of five instead of being squeezed into one row of
    // ten - which on a phone is 29px a column, thinner than the artwork marker. The bars are
    // shorter to leave room for the second row.
    column: "w-[3.4rem] shrink-0",
    container: "max-w-[19rem] flex-wrap gap-x-1.5 gap-y-5",
    track: "h-44 max-w-[3.4rem]",
    trackPx: 176,
    marker: "h-9 w-9",
    markerPx: 36,
    label: "text-[8px]",
    total: "text-[1.05rem]",
  },
} as const;

type BarSize = keyof typeof BAR_SIZES;

function barSizeFor(playerCount: number): BarSize {
  if (playerCount === 2) return "duo";
  if (playerCount <= 4) return "group";
  return playerCount <= 6 ? "wide" : "xwide";
}

function RatingsBattle({ players, onSkip }: { players: RoundResultPlayerInfo[]; onSkip: () => void }) {
  const [grown, setGrown] = useState(false);
  const [settled, setSettled] = useState<boolean[]>(() => players.map(() => false));
  const size = barSizeFor(players.length);
  const isDuo = size === "duo";

  useEffect(() => {
    const growTimer = window.setTimeout(() => setGrown(true), BAR_GROW_START_DELAY);
    return () => window.clearTimeout(growTimer);
  }, []);

  const handleSettled = useCallback((index: number) => {
    setSettled((prev) => {
      if (prev[index]) return prev;
      const next = [...prev];
      next[index] = true;
      return next;
    });
  }, []);

  const totals = players.map((p) => (p.ratings ? ratingsTotal(p.ratings) : 0));
  const maxTotal = Math.max(...totals);
  const leaderCount = totals.filter((t) => t === maxTotal).length;
  const revealed = settled.length > 0 && settled.every(Boolean);

  // Advance shortly after every bar actually finishes (rather than always waiting out the fixed
  // COMPARE_MS ceiling sized for a worst-case max-total round) - most rounds settle well before
  // that, so the pause after the bars stop feels proportionate instead of always dragging on.
  useEffect(() => {
    if (!revealed) return;
    const timer = window.setTimeout(onSkip, POST_SETTLE_PAUSE_MS);
    return () => window.clearTimeout(timer);
  }, [revealed, onSkip]);

  const columns = players.map((p, i) => (
    <RatingBar
      key={p.id}
      label={p.isMe ? "You" : p.label}
      image={p.image}
      total={totals[i]}
      grown={grown}
      size={size}
      accent={BAR_ACCENTS[i % BAR_ACCENTS.length]}
      ahead={revealed && totals[i] === maxTotal && leaderCount === 1}
      trailing={revealed && totals[i] !== maxTotal}
      index={i}
      onSettled={handleSettled}
    />
  ));
  if (isDuo) {
    columns.splice(1, 0, (
      <span
        key="vs"
        className="font-display mb-44 shrink-0 text-xl font-black tracking-tight text-slate-600"
      >
        VS
      </span>
    ));
  }

  return (
    <div
      onClick={onSkip}
      className="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#07070c] px-5"
    >
      {/* Stage lighting. A pool of light overhead and a darker floor give the
          columns somewhere to stand, instead of floating on flat black. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-pulse absolute left-1/2 top-[6%] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-amber-400/12 blur-3xl" />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: "linear-gradient(to top, rgb(0 0 0 / 75%), transparent)" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(120% 75% at 50% 45%, transparent 45%, rgb(0 0 0 / 65%) 100%)" }}
        />
      </div>

      <header className="enter-up relative mb-8 text-center">
        <p className="section-label text-amber-300/70">Round Score</p>
        <h2 className="font-display mt-1.5 text-[1.6rem] font-extrabold leading-none tracking-tight text-white">
          {revealed ? (leaderCount > 1 ? "Dead Heat" : "We Have a Winner") : "The Judge Scores"}
        </h2>
      </header>

      <div className={`relative flex w-full items-end justify-center ${BAR_SIZES[size].container}`}>
        {columns}
      </div>

      <p
        className={`relative mt-9 text-[11px] font-semibold transition-opacity duration-500 ${
          revealed ? "opacity-0" : "text-slate-600 opacity-100"
        }`}
      >
        Tap to skip →
      </p>
    </div>
  );
}

/** The four things the judge scores, in the order the rubric asks for them. */
const ASPECTS = [
  { key: "art", label: "Art" },
  { key: "fame", label: "Fame" },
  { key: "chase", label: "Chase" },
  { key: "rarity", label: "Rarity" },
] as const;

const MAX_ASPECT = 10;

/**
 * The scorecard beat: every card's four aspect scores, after the bars have settled the totals.
 *
 * Until now those four numbers existed only in the round's data - the bars showed the total they
 * add up to and the badge showed the letter it lands on, so "why" was never actually on screen.
 * Each player keeps the accent colour their bar had a moment earlier, which is what lets the two
 * screens read as one thought rather than two charts.
 */
function RatingsBreakdown({ players, onSkip }: { players: RoundResultPlayerInfo[]; onSkip: () => void }) {
  const [grown, setGrown] = useState(false);
  // Ten players is forty meters; the roomier row only fits on a small table.
  const roomy = players.length <= 4;

  useEffect(() => {
    const timer = window.setTimeout(() => setGrown(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  // Per-aspect leaders, so the round reads as a set of categories someone took rather than one
  // number. Ties highlight everyone level at the top, which is the honest outcome.
  const leaders = ASPECTS.map(({ key }) => Math.max(...players.map((p) => p.ratings?.[key] ?? 0)));

  return (
    <div
      onClick={onSkip}
      className="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#07070c] px-5"
    >
      {/* Same stage lighting as the bars - this is the second half of that scene. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-pulse absolute left-1/2 top-[6%] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-amber-400/12 blur-3xl" />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: "linear-gradient(to top, rgb(0 0 0 / 75%), transparent)" }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(120% 75% at 50% 45%, transparent 45%, rgb(0 0 0 / 65%) 100%)" }}
        />
      </div>

      <header className="enter-up relative mb-6 text-center">
        <p className="section-label text-amber-300/70">Round Score</p>
        <h2 className="font-display mt-1.5 text-[1.6rem] font-extrabold leading-none tracking-tight text-white">
          Where It Was Won
        </h2>
      </header>

      <div className="relative flex w-full max-w-sm flex-col gap-2.5">
        {/* Column headings, so the four numbers below never need repeating per row. */}
        <div className={`flex items-center gap-2 pl-[5.8rem] pr-[2.9rem] ${roomy ? "mb-0.5" : ""}`}>
          {ASPECTS.map((a) => (
            <span
              key={a.key}
              className="flex-1 text-center text-[8.5px] font-black uppercase tracking-[0.14em] text-slate-500"
            >
              {a.label}
            </span>
          ))}
        </div>

        {players.map((player, row) => {
          const accent = BAR_ACCENTS[row % BAR_ACCENTS.length];
          const total = player.ratings ? ratingsTotal(player.ratings) : 0;
          return (
            <div
              key={player.id}
              className="bar-enter flex items-center gap-2"
              style={{ "--d": `${row * 70}ms` } as React.CSSProperties}
            >
              {/* Wide enough for a full-length nickname: at 3.6rem the thumbnail left room for
                  about three characters, so every name past "Ana" was an ellipsis. */}
              <div className="flex w-[5.3rem] flex-shrink-0 items-center gap-1.5">
                <span
                  className={`overflow-hidden rounded-md border bg-black/40 ${accent.border} ${
                    roomy ? "h-7 w-7" : "h-6 w-6"
                  }`}
                >
                  {player.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.image} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className={`truncate text-[9px] font-black uppercase tracking-[0.04em] ${accent.text}`}>
                  {player.isMe ? "You" : player.label}
                </span>
              </div>

              {ASPECTS.map((a, col) => {
                const value = player.ratings?.[a.key] ?? 0;
                const isLeader = value > 0 && value === leaders[col];
                return (
                  <div key={a.key} className="flex flex-1 flex-col items-center gap-1">
                    <span
                      className={`font-display tabular-nums font-black leading-none transition-colors duration-300 ${
                        isLeader ? accent.text : "text-slate-400"
                      } ${roomy ? "text-[1.05rem]" : "text-[0.9rem]"}`}
                    >
                      {value}
                    </span>
                    <span className="relative h-[3px] w-full overflow-hidden rounded-full bg-white/10">
                      <span
                        className={`absolute inset-0 origin-left rounded-full bg-gradient-to-r ${accent.grad}`}
                        style={{
                          transform: `scaleX(${grown ? value / MAX_ASPECT : 0})`,
                          transition: "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
                          transitionDelay: `${row * 70 + col * 90}ms`,
                          boxShadow: isLeader ? `0 0 10px -2px ${accent.glow}` : "none",
                        }}
                      />
                    </span>
                  </div>
                );
              })}

              <span
                className={`font-display w-[2.4rem] flex-shrink-0 text-right tabular-nums font-black leading-none ${accent.text} ${
                  roomy ? "text-[1.15rem]" : "text-[1rem]"
                }`}
                style={{ textShadow: `0 0 18px ${accent.glow}` }}
              >
                {total}
              </span>
            </div>
          );
        })}
      </div>

      <p className="relative mt-8 text-[11px] font-semibold text-slate-600">Tap to skip →</p>
    </div>
  );
}

function RatingBar({
  label,
  image,
  total,
  grown,
  accent,
  ahead,
  trailing,
  size,
  index,
  onSettled,
}: {
  label: string;
  image: string | null;
  total: number;
  grown: boolean;
  accent: BarAccent;
  ahead: boolean;
  trailing: boolean;
  size: BarSize;
  index: number;
  onSettled: (index: number) => void;
}) {
  const [currentTotal, setCurrentTotal] = useState(0);

  // Every bar runs the exact same elapsed-time -> total curve (independent of its own total), so
  // their instantaneous speed is identical - a bar only stops early because it clamps at its own
  // total, not because it was ever moving slower than the others.
  useEffect(() => {
    if (!grown) return;
    let rafId = 0;
    let startTs: number | null = null;

    function tick(ts: number) {
      if (startTs === null) startTs = ts;
      const rawFrac = Math.min(1, (ts - startTs) / BAR_GROW_MS);
      const eased = 1 - Math.pow(1 - rawFrac, 3); // cubic ease-out
      const next = Math.min(total, eased * MAX_RATINGS_TOTAL);
      setCurrentTotal(next);
      if (next < total && rawFrac < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        onSettled(index);
      }
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [grown, total, onSettled, index]);

  const pct = grown ? Math.max(6, (currentTotal / MAX_RATINGS_TOTAL) * 100) : 0;
  const currentTier = grown ? tierForTotal(Math.round(currentTotal)) : "F";

  // Pixel math (matching the Tailwind track/marker classes in BAR_SIZES) so the marker's own
  // height is accounted for and it never pokes out above the track, even at a near-max total.
  const dim = BAR_SIZES[size];
  const imageBottomPx = Math.min((pct / 100) * dim.trackPx, dim.trackPx - dim.markerPx);

  return (
    <div
      className={`bar-enter flex flex-col items-center gap-2.5 transition-all duration-700 ${dim.column} ${
        trailing ? "opacity-55 saturate-[0.65]" : "opacity-100"
      }`}
      style={{ "--d": `${index * 110}ms` } as React.CSSProperties}
    >
      <p
        className={`truncate font-bold uppercase tracking-[0.18em] transition-colors duration-500 ${
          ahead ? accent.text : "text-slate-400"
        } ${dim.label}`}
      >
        {label}
      </p>

      <div className={`relative w-full ${dim.track}`}>
        {/* Accent floodlight behind the column, brightening as the bar climbs. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-8 -inset-y-4 rounded-full blur-2xl transition-opacity duration-500"
          style={{ background: accent.glow, opacity: grown ? 0.05 + (pct / 100) * 0.16 : 0 }}
        />

        <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/12 bg-black/40">
          {/* Tier reference marks - they turn the climb into a race past named
              thresholds instead of a bar growing to an arbitrary height. */}
          {MAJOR_TIER_MARKS.map((mark) => {
            const cleared = currentTotal >= mark.min;
            return (
              <div
                key={mark.label}
                className="pointer-events-none absolute inset-x-0 flex items-center gap-1 px-1.5"
                style={{ bottom: `${(mark.min / MAX_RATINGS_TOTAL) * 100}%` }}
              >
                <span
                  className={`h-px flex-1 transition-colors duration-300 ${
                    cleared ? "bg-white/25" : "bg-white/10"
                  }`}
                />
                <span
                  className={`text-[8px] font-black leading-none transition-colors duration-300 ${
                    cleared ? "text-white/70" : "text-white/25"
                  }`}
                >
                  {mark.label}
                </span>
              </div>
            );
          })}

          <div
            className={`absolute inset-x-0 bottom-0 overflow-hidden rounded-t-xl bg-gradient-to-t ${accent.grad} ${
              ahead ? "victory-pulse" : ""
            }`}
            style={{
              height: `${pct}%`,
              boxShadow: grown ? `0 0 34px -6px ${accent.glow}` : "none",
            }}
          >
            <div aria-hidden className="bar-energy absolute -inset-x-2 -top-4 bottom-0" />
          </div>

          {/* Leading edge - the part the eye actually tracks while it climbs. */}
          {grown && (
            <div
              aria-hidden
              className="bar-cap pointer-events-none absolute inset-x-0 h-[3px] rounded-full bg-white"
              style={{ bottom: `calc(${pct}% - 1.5px)`, boxShadow: `0 0 14px 3px ${accent.glow}` }}
            />
          )}
        </div>

        <div
          className={`absolute left-1/2 -translate-x-1/2 overflow-hidden rounded-xl border-2 bg-black/40 transition-shadow duration-500 ${accent.border} ${dim.marker}`}
          style={{
            bottom: `${imageBottomPx}px`,
            boxShadow: ahead ? `0 0 30px -4px ${accent.glow}` : "0 10px 22px -10px rgb(0 0 0 / 90%)",
          }}
        >
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={label} className="h-full w-full object-cover" />
          )}
        </div>
      </div>

      {/* Live total + tier. The number is what makes the climb legible; the tier
          letter is keyed so it replays its pop every time the bar crosses a
          threshold, turning each upgrade into its own small beat. */}
      <div className="flex flex-col items-center">
        <p
          className={`font-display tabular-nums font-black leading-none transition-opacity duration-300 ${
            grown ? "opacity-100" : "opacity-0"
          } ${accent.text} ${dim.total}`}
          style={{ textShadow: `0 0 22px ${accent.glow}` }}
        >
          {Math.round(currentTotal)}
        </p>
        <p
          key={currentTier}
          className={`tier-pop mt-0.5 font-black uppercase leading-none tracking-[0.14em] transition-opacity duration-300 ${
            grown ? "opacity-100" : "opacity-0"
          } ${ahead ? accent.text : "text-slate-400"} ${dim.label}`}
        >
          Tier {currentTier}
        </p>
      </div>
    </div>
  );
}

const TIER_COLORS: Record<string, string> = {
  S: "border-amber-300 bg-amber-400/15 text-amber-300 shadow-[0_0_30px_-6px_rgba(251,191,36,0.7)]",
  "A+": "border-purple-300 bg-purple-400/15 text-purple-200",
  A: "border-purple-300 bg-purple-400/15 text-purple-200",
  "A-": "border-purple-300 bg-purple-400/15 text-purple-200",
  "B+": "border-emerald-300 bg-emerald-400/15 text-emerald-200",
  B: "border-emerald-300 bg-emerald-400/15 text-emerald-200",
  "B-": "border-emerald-300 bg-emerald-400/15 text-emerald-200",
  "C+": "border-sky-300 bg-sky-400/15 text-sky-200",
  C: "border-sky-300 bg-sky-400/15 text-sky-200",
  "C-": "border-sky-300 bg-sky-400/15 text-sky-200",
  D: "border-slate-400 bg-slate-400/15 text-slate-300",
  F: "border-red-400 bg-red-400/15 text-red-300",
};

function TierBadge({ tier, size }: { tier: string; size: "large" | "small" }) {
  const colors = TIER_COLORS[tier] ?? TIER_COLORS.F;
  if (size === "large") {
    return (
      <div className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-6 py-3 ${colors}`}>
        <span className="text-3xl font-black leading-none">{tier}</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.25em] opacity-80">Tier</span>
      </div>
    );
  }
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-black ${colors}`}>Tier {tier}</span>
  );
}

function ResultCard({
  label,
  pick,
  image,
  winner,
  ratings,
  onOpenFullView,
}: {
  label: string;
  pick: BattleRoundPlayerState;
  image: string | null;
  winner: boolean;
  ratings?: CardRatings;
  onOpenFullView: (src: string, prompt?: string) => void;
}) {
  const name = pick.pokemons.map((p) => p.displayName).join(" & ");

  return (
    <div
      className={`overflow-hidden rounded-2xl border-2 ${
        winner ? "border-amber-300 shadow-[0_0_24px_-4px_rgba(251,191,36,0.6)]" : "border-white/10"
      }`}
    >
      <button
        type="button"
        onClick={() => image && onOpenFullView(image, pick.prompt)}
        aria-label={image ? `View ${name} artwork full size` : undefined}
        disabled={!image}
        className="relative block aspect-[3/4] w-full bg-black/30 disabled:cursor-default"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">Loading...</div>
        )}
        {winner && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-900">
            WIN
          </span>
        )}
        {image && (
          <span className="glass absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-white">
            <Icon name="expand" size={12} />
          </span>
        )}
      </button>
      <div className="bg-slate-900/90 px-2 py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-xs font-bold text-white">{name}</p>
        <div className="mt-1 flex flex-wrap justify-center gap-1">
          <TraitChip tone="gold" small>
            {pick.artType.label}
          </TraitChip>
          {pick.specialForm.value !== "none" && (
            <TraitChip tone="violet" small>
              {pick.specialForm.label}
            </TraitChip>
          )}
          <TraitChip tone="teal" small>
            {pick.vibe.label}
          </TraitChip>
        </div>
        {ratings && (
          <div className="mt-1.5 flex justify-center border-t border-white/10 pt-1.5">
            <TierBadge tier={ratingsTier(ratings)} size="small" />
          </div>
        )}
      </div>
    </div>
  );
}
