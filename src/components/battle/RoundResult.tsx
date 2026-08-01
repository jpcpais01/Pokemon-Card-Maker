"use client";

import { useCallback, useEffect, useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";
import { ratingsTier, ratingsTotal, tierForTotal } from "@/lib/battle/tier";
import type { BattleRound, BattleRoundPlayerState, CardRatings } from "@/lib/battle/types";

const CARD_SPOTLIGHT_MS = 3000;
const COMPARE_MS = 15000;
const VICTORY_SPOTLIGHT_MS = 4000;

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
  /** Ordered with "me" first, then every other player in a stable order. 2 to 4 entries. */
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
  const [fullView, setFullView] = useState<{ src: string; prompt?: string } | null>(null);

  const n = players.length;
  const COMPARE_PHASE = n;
  const VICTORY_PHASE = n + 1;
  const SUMMARY_PHASE = n + 2;

  const allImagesReady = players.every((p) => !!p.image);
  // Only worth a dedicated bars-comparison beat when the judge actually produced ratings -
  // a coin-flip/default-win round has none, so it skips straight to the victory spotlight.
  const hasRatings = !!round.ratings;

  const advancePhase = useCallback(() => {
    setPhaseIndex((p) => {
      if (p < n - 1) return p + 1;
      if (p === n - 1) return hasRatings ? COMPARE_PHASE : VICTORY_PHASE;
      if (p === COMPARE_PHASE) return VICTORY_PHASE;
      return SUMMARY_PHASE;
    });
  }, [n, hasRatings, COMPARE_PHASE, VICTORY_PHASE, SUMMARY_PHASE]);

  useEffect(() => {
    if (phaseIndex === SUMMARY_PHASE || !allImagesReady) return;
    const duration =
      phaseIndex === VICTORY_PHASE ? VICTORY_SPOTLIGHT_MS : phaseIndex === COMPARE_PHASE ? COMPARE_MS : CARD_SPOTLIGHT_MS;
    const timer = window.setTimeout(advancePhase, duration);
    return () => window.clearTimeout(timer);
  }, [phaseIndex, allImagesReady, advancePhase, SUMMARY_PHASE, VICTORY_PHASE, COMPARE_PHASE]);

  if (phaseIndex === COMPARE_PHASE) {
    return <RatingsBattle players={players} onSkip={advancePhase} />;
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
            onOpenFullView={(src, prompt) => setFullView({ src, prompt })}
          />
        ))}
      </div>

      {round.verdict && (
        <p className="glass mt-4 rounded-xl p-3 text-center text-xs italic leading-relaxed text-slate-300">
          &ldquo;{round.verdict}&rdquo;
        </p>
      )}

      <button
        type="button"
        onClick={onReady}
        disabled={myReady || readyBusy}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
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
          prompt={fullView.prompt}
          onClose={() => setFullView(null)}
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
      className="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center gap-5 bg-[#05060f] px-6 py-10"
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
          <p className="mt-1 text-2xl font-black text-white">{name}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
              {pick.artType.label}
            </span>
            {pick.specialForm.value !== "none" && (
              <span className="rounded-full bg-purple-400/15 px-2.5 py-1 text-xs font-semibold text-purple-300">
                {pick.specialForm.label}
              </span>
            )}
            <span className="rounded-full bg-teal-400/15 px-2.5 py-1 text-xs font-semibold text-teal-300">
              {pick.vibe.label}
            </span>
          </div>
        </div>

        {isVictory && verdict && (
          <p className="glass max-w-xs rounded-xl p-3 text-center text-xs italic leading-relaxed text-slate-300">
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

/** Up to 4 distinct accents, one per player column. */
const BAR_ACCENTS: BarAccent[] = [
  { grad: "from-amber-600 via-amber-400 to-yellow-200", border: "border-amber-300", text: "text-amber-300", glow: "rgba(251,191,36,0.75)" },
  { grad: "from-violet-700 via-fuchsia-500 to-cyan-300", border: "border-fuchsia-300", text: "text-fuchsia-300", glow: "rgba(217,70,239,0.75)" },
  { grad: "from-emerald-700 via-emerald-400 to-teal-200", border: "border-emerald-300", text: "text-emerald-300", glow: "rgba(16,185,129,0.75)" },
  { grad: "from-sky-700 via-sky-400 to-blue-200", border: "border-sky-300", text: "text-sky-300", glow: "rgba(56,189,248,0.75)" },
];

function RatingsBattle({ players, onSkip }: { players: RoundResultPlayerInfo[]; onSkip: () => void }) {
  const [grown, setGrown] = useState(false);
  const [settled, setSettled] = useState<boolean[]>(() => players.map(() => false));
  const isDuo = players.length === 2;

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
      isDuo={isDuo}
      accent={BAR_ACCENTS[i % BAR_ACCENTS.length]}
      ahead={revealed && totals[i] === maxTotal && leaderCount === 1}
      index={i}
      onSettled={handleSettled}
    />
  ));
  if (isDuo) {
    columns.splice(1, 0, (
      <span key="vs" className="mb-40 text-2xl font-black text-slate-500">
        VS
      </span>
    ));
  }

  return (
    <div
      onClick={onSkip}
      className="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center gap-10 bg-[#05060f] px-6 py-10"
    >
      <div className={`flex w-full max-w-sm items-end justify-center ${isDuo ? "gap-6" : "gap-3"}`}>{columns}</div>

      <p className="text-xs font-semibold text-slate-600">Tap to skip →</p>
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
  isDuo,
  index,
  onSettled,
}: {
  label: string;
  image: string | null;
  total: number;
  grown: boolean;
  accent: BarAccent;
  ahead: boolean;
  isDuo: boolean;
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

  // Pixel math (matching the Tailwind track/image size classes below) so the image marker's own
  // height is accounted for and it never pokes out above the track, even at a near-max total.
  const trackHeightPx = isDuo ? 416 : 256;
  const imageSizePx = isDuo ? 96 : 56;
  const imageBottomPx = Math.min((pct / 100) * trackHeightPx, trackHeightPx - imageSizePx);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className={`font-bold uppercase tracking-[0.2em] text-slate-400 ${isDuo ? "text-xs" : "text-[10px]"}`}>
        {label}
      </p>

      <div className={`relative ${isDuo ? "h-[26rem] w-32" : "h-64 w-20"}`}>
        <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/15 bg-white/5">
          <div
            className={`absolute inset-x-0 bottom-0 rounded-t-2xl bg-gradient-to-t ${accent.grad} ${ahead ? "victory-pulse" : ""}`}
            style={{
              height: `${pct}%`,
              boxShadow: grown ? `0 0 40px -4px ${accent.glow}` : "none",
            }}
          />
        </div>

        <div
          className={`absolute left-1/2 -translate-x-1/2 overflow-hidden rounded-2xl border-2 bg-black/40 shadow-lg ${accent.border} ${
            isDuo ? "h-24 w-24" : "h-14 w-14"
          }`}
          style={{ bottom: `${imageBottomPx}px` }}
        >
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={label} className="h-full w-full object-cover" />
          )}
        </div>
      </div>

      <p
        className={`font-black transition-opacity duration-300 ${grown ? "opacity-100" : "opacity-0"} ${accent.text} ${
          isDuo ? "text-4xl" : "text-2xl"
        }`}
      >
        {currentTier}
      </p>
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
          <span className="glass absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white">
            ⤢
          </span>
        )}
      </button>
      <div className="bg-slate-900/90 px-2 py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-xs font-bold text-white">{name}</p>
        <div className="mt-1 flex flex-wrap justify-center gap-1">
          <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
            {pick.artType.label}
          </span>
          {pick.specialForm.value !== "none" && (
            <span className="rounded-full bg-purple-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-purple-300">
              {pick.specialForm.label}
            </span>
          )}
          <span className="rounded-full bg-teal-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-teal-300">
            {pick.vibe.label}
          </span>
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
