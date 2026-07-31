"use client";

import { useCallback, useEffect, useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";
import { ratingsTier, ratingsTotal, tierForTotal } from "@/lib/battle/tier";
import type { BattleRound, BattleRoundPlayerState, CardRatings } from "@/lib/battle/types";

type Phase = "card1" | "card2" | "compare" | "victory" | "summary";

const CARD_SPOTLIGHT_MS = 3000;
const COMPARE_MS = 15000;
const VICTORY_SPOTLIGHT_MS = 4000;

interface Props {
  round: BattleRound;
  myId: string;
  opponentId: string;
  myImage: string | null;
  opponentImage: string | null;
  isLastRound: boolean;
  myReady: boolean;
  opponentReady: boolean;
  readyBusy: boolean;
  onReady: () => void;
  opponentLabel?: string;
}

export default function RoundResult({
  round,
  myId,
  opponentId,
  myImage,
  opponentImage,
  isLastRound,
  myReady,
  opponentReady,
  readyBusy,
  onReady,
  opponentLabel = "Opponent",
}: Props) {
  const [phase, setPhase] = useState<Phase>("card1");
  const [fullViewSrc, setFullViewSrc] = useState<string | null>(null);

  const iWon = round.winnerId === myId;
  const myPick = round.players[myId];
  const opponentPick = round.players[opponentId];
  const bothImagesReady = !!myImage && !!opponentImage;

  // Only worth a dedicated bars-comparison beat when the judge actually produced ratings -
  // a coin-flip/default-win round has none, so it skips straight to the victory spotlight.
  const hasRatings = !!round.ratings;

  const advancePhase = useCallback(() => {
    setPhase((p) => {
      if (p === "card1") return "card2";
      if (p === "card2") return hasRatings ? "compare" : "victory";
      if (p === "compare") return "victory";
      return "summary";
    });
  }, [hasRatings]);

  useEffect(() => {
    if (phase === "summary" || !bothImagesReady) return;
    const duration = phase === "victory" ? VICTORY_SPOTLIGHT_MS : phase === "compare" ? COMPARE_MS : CARD_SPOTLIGHT_MS;
    const timer = window.setTimeout(advancePhase, duration);
    return () => window.clearTimeout(timer);
  }, [phase, bothImagesReady, advancePhase]);

  if (phase === "compare") {
    return (
      <RatingsBattle
        myLabel="You"
        myImage={myImage}
        myRatings={round.ratings?.[myId]}
        opponentLabel={opponentLabel}
        opponentImage={opponentImage}
        opponentRatings={round.ratings?.[opponentId]}
        onSkip={advancePhase}
      />
    );
  }

  if (phase !== "summary") {
    const spotlight =
      phase === "card1"
        ? { label: "You", pick: myPick, image: myImage }
        : phase === "card2"
          ? { label: opponentLabel, pick: opponentPick, image: opponentImage }
          : {
              label: iWon ? "You" : opponentLabel,
              pick: iWon ? myPick : opponentPick,
              image: iWon ? myImage : opponentImage,
            };

    return (
      <CardSpotlight
        phase={phase}
        label={spotlight.label}
        pick={spotlight.pick}
        image={spotlight.image}
        loading={!bothImagesReady}
        verdict={round.verdict}
        ratings={phase === "victory" ? round.ratings?.[iWon ? myId : opponentId] : undefined}
        onSkip={advancePhase}
      />
    );
  }

  return (
    <div>
      <p className="text-center text-sm font-bold text-amber-300">
        {iWon ? "🏆 You won this round!" : "This round goes to your opponent."}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <ResultCard
          label="You"
          pick={myPick}
          image={myImage}
          winner={iWon}
          ratings={round.ratings?.[myId]}
          onOpenFullView={setFullViewSrc}
        />
        <ResultCard
          label={opponentLabel}
          pick={opponentPick}
          image={opponentImage}
          winner={!iWon}
          ratings={round.ratings?.[opponentId]}
          onOpenFullView={setFullViewSrc}
        />
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
          ? opponentReady
            ? "Continuing..."
            : "Waiting for opponent..."
          : isLastRound
            ? "See Final Results"
            : "Next Round"}
      </button>

      {fullViewSrc && (
        <ImageLightbox src={fullViewSrc} alt="Full size artwork" onClose={() => setFullViewSrc(null)} />
      )}
    </div>
  );
}

function CardSpotlight({
  phase,
  label,
  pick,
  image,
  loading,
  verdict,
  ratings,
  onSkip,
}: {
  phase: Phase;
  label: string;
  pick: BattleRoundPlayerState;
  image: string | null;
  loading: boolean;
  verdict?: string;
  ratings?: CardRatings;
  onSkip: () => void;
}) {
  const name = pick.pokemons.map((p) => p.displayName).join(" & ");
  const isVictory = phase === "victory";

  return (
    <div
      onClick={onSkip}
      className="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center gap-5 bg-[#05060f] px-6 py-10"
    >
      <div key={phase} className="spotlight-in flex w-full flex-col items-center gap-5">
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
            {pick.region.value !== "default" && (
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                {pick.region.label}
              </span>
            )}
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

// Reference duration for growing from 0 to the theoretical max total (4 categories x 10) - both
// bars share this exact rate, so they rise together and whichever total is lower simply stops
// first while the other keeps climbing until it reaches its own value.
const MAX_RATINGS_TOTAL = 40;
const BAR_GROW_MS = 13200;
const BAR_GROW_START_DELAY = 200;
const POST_SETTLE_PAUSE_MS = 1000;

function RatingsBattle({
  myLabel,
  myImage,
  myRatings,
  opponentLabel,
  opponentImage,
  opponentRatings,
  onSkip,
}: {
  myLabel: string;
  myImage: string | null;
  myRatings?: CardRatings;
  opponentLabel: string;
  opponentImage: string | null;
  opponentRatings?: CardRatings;
  onSkip: () => void;
}) {
  const [grown, setGrown] = useState(false);
  const [mySettled, setMySettled] = useState(false);
  const [opponentSettled, setOpponentSettled] = useState(false);

  useEffect(() => {
    const growTimer = window.setTimeout(() => setGrown(true), BAR_GROW_START_DELAY);
    return () => window.clearTimeout(growTimer);
  }, []);

  const handleMySettled = useCallback(() => setMySettled(true), []);
  const handleOpponentSettled = useCallback(() => setOpponentSettled(true), []);

  const myTotal = myRatings ? ratingsTotal(myRatings) : 0;
  const opponentTotal = opponentRatings ? ratingsTotal(opponentRatings) : 0;
  const revealed = mySettled && opponentSettled;
  const myAhead = revealed && myTotal > opponentTotal;
  const opponentAhead = revealed && opponentTotal > myTotal;

  // Advance shortly after both bars actually finish (rather than always waiting out the fixed
  // COMPARE_MS ceiling sized for a worst-case max-total round) - most rounds settle well before
  // that, so this is what keeps the pause after the bars stop feeling proportionate instead of
  // always dragging on regardless of how far either bar actually had to climb.
  useEffect(() => {
    if (!revealed) return;
    const timer = window.setTimeout(onSkip, POST_SETTLE_PAUSE_MS);
    return () => window.clearTimeout(timer);
  }, [revealed, onSkip]);

  return (
    <div
      onClick={onSkip}
      className="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center gap-10 bg-[#05060f] px-6 py-10"
    >
      <div className="flex w-full max-w-sm items-end justify-center gap-6">
        <RatingBar
          label={myLabel}
          image={myImage}
          total={myTotal}
          grown={grown}
          accent="amber"
          ahead={myAhead}
          onSettled={handleMySettled}
        />
        <span className="mb-40 text-2xl font-black text-slate-500">VS</span>
        <RatingBar
          label={opponentLabel}
          image={opponentImage}
          total={opponentTotal}
          grown={grown}
          accent="violet"
          ahead={opponentAhead}
          onSettled={handleOpponentSettled}
        />
      </div>

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
  onSettled,
}: {
  label: string;
  image: string | null;
  total: number;
  grown: boolean;
  accent: "amber" | "violet";
  ahead: boolean;
  onSettled: () => void;
}) {
  const [currentTotal, setCurrentTotal] = useState(0);
  const isAmber = accent === "amber";

  // Both bars run the exact same elapsed-time -> total curve (independent of this bar's own
  // total), so their instantaneous speed is identical - a bar only stops early because it clamps
  // at its own total, not because it was ever moving slower than the other one.
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
        onSettled();
      }
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [grown, total, onSettled]);

  const pct = grown ? Math.max(6, (currentTotal / MAX_RATINGS_TOTAL) * 100) : 0;
  const currentTier = grown ? tierForTotal(Math.round(currentTotal)) : "F";

  // Pixel math (matching the h-[26rem]/h-24 Tailwind classes below) so the image marker's own
  // height is accounted for and it never pokes out above the track, even at a near-max total.
  const trackHeightPx = 416;
  const imageSizePx = 96;
  const imageBottomPx = Math.min((pct / 100) * trackHeightPx, trackHeightPx - imageSizePx);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>

      <div className="relative h-[26rem] w-32">
        <div className="absolute inset-0 overflow-hidden rounded-3xl border border-white/15 bg-white/5">
          <div
            className={`absolute inset-x-0 bottom-0 rounded-t-2xl bg-gradient-to-t ${
              isAmber ? "from-amber-600 via-amber-400 to-yellow-200" : "from-violet-700 via-fuchsia-500 to-cyan-300"
            } ${ahead ? "victory-pulse" : ""}`}
            style={{
              height: `${pct}%`,
              boxShadow: grown
                ? isAmber
                  ? "0 0 40px -4px rgba(251,191,36,0.75)"
                  : "0 0 40px -4px rgba(217,70,239,0.75)"
                : "none",
            }}
          />
        </div>

        <div
          className={`absolute left-1/2 h-24 w-24 -translate-x-1/2 overflow-hidden rounded-2xl border-2 bg-black/40 shadow-lg ${
            isAmber ? "border-amber-300" : "border-fuchsia-300"
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
        className={`text-4xl font-black transition-opacity duration-300 ${grown ? "opacity-100" : "opacity-0"} ${
          isAmber ? "text-amber-300" : "text-fuchsia-300"
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
  onOpenFullView: (src: string) => void;
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
        onClick={() => image && onOpenFullView(image)}
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
          {pick.region.value !== "default" && (
            <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
              {pick.region.label}
            </span>
          )}
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
