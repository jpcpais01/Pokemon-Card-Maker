"use client";

import { useCallback, useEffect, useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";
import { ratingsTier } from "@/lib/battle/tier";
import type { BattleRound, BattleRoundPlayerState, CardRatings } from "@/lib/battle/types";

type Phase = "card1" | "card2" | "victory" | "summary";

const CARD_SPOTLIGHT_MS = 3000;
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

  const advancePhase = useCallback(() => {
    setPhase((p) => (p === "card1" ? "card2" : p === "card2" ? "victory" : "summary"));
  }, []);

  useEffect(() => {
    if (phase === "summary" || !bothImagesReady) return;
    const duration = phase === "victory" ? VICTORY_SPOTLIGHT_MS : CARD_SPOTLIGHT_MS;
    const timer = window.setTimeout(advancePhase, duration);
    return () => window.clearTimeout(timer);
  }, [phase, bothImagesReady, advancePhase]);

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
