"use client";

import { useState } from "react";
import Link from "next/link";
import ImageLightbox from "@/components/ImageLightbox";
import { useFavoriteToggle } from "@/lib/favorites";

export interface MatchResultPlayer {
  id: string;
  label: string;
  score: number;
  isMe: boolean;
}

export interface MatchResultMvp {
  label: string;
  image: string | null;
  prompt?: string;
  pokemonNames: string;
  artType: string;
  specialForm?: string;
  vibe: string;
  scoreLabel: string;
}

interface Props {
  players: MatchResultPlayer[];
  mvp?: MatchResultMvp | null;
}

export default function MatchResult({ players, mvp }: Props) {
  const [fullView, setFullView] = useState(false);
  const { isFavorited, toggle, error: favoriteError } = useFavoriteToggle(
    mvp?.image ?? null,
    mvp
      ? { prompt: mvp.prompt, pokemonNames: mvp.pokemonNames, artType: mvp.artType, specialForm: mvp.specialForm, vibe: mvp.vibe }
      : null
  );

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;
  const winners = sorted.filter((p) => p.score === topScore);
  const tied = winners.length > 1;
  const iAmTiedLeader = tied && winners.some((p) => p.isMe);
  const iWon = !tied && winners.some((p) => p.isMe);

  const title = tied ? (iAmTiedLeader ? "It's a Tie!" : "You Lose") : iWon ? "You Win! 🏆" : "You Lose";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="glass w-full max-w-sm rounded-[2rem] p-6 text-center shadow-2xl shadow-black/40">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-300/90">Match Complete</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">{title}</h1>

        {mvp && mvp.image && (
          <button
            type="button"
            onClick={() => setFullView(true)}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-2.5 text-left active:scale-[0.98]"
          >
            <div className="relative aspect-[3/4] h-20 flex-shrink-0 overflow-hidden rounded-xl border border-amber-300/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mvp.image} alt={mvp.pokemonNames} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">🏆 MVP Card</p>
              <p className="truncate text-sm font-black text-white">{mvp.pokemonNames}</p>
              <p className="text-xs text-slate-400">
                {mvp.label} - {mvp.scoreLabel}
              </p>
            </div>
          </button>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                p.isMe ? "border border-amber-300/40 bg-amber-400/10" : "glass"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-black text-slate-500">#{i + 1}</span>
                <span className="text-sm font-bold text-white">{p.isMe ? "You" : p.label}</span>
              </div>
              <span className={`text-xl font-black ${p.isMe ? "text-amber-300" : "text-slate-200"}`}>{p.score}</span>
            </div>
          ))}
        </div>

        <Link
          href="/battle"
          className="mt-8 block w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98]"
        >
          Play Again
        </Link>
        <Link
          href="/"
          className="glass mt-3 block w-full rounded-2xl py-3.5 text-sm font-semibold text-slate-200 transition-colors active:bg-white/10"
        >
          Back to Solo Mode
        </Link>
      </div>

      {fullView && mvp?.image && (
        <ImageLightbox
          src={mvp.image}
          alt={mvp.pokemonNames}
          prompt={mvp.prompt}
          onClose={() => setFullView(false)}
          isFavorited={isFavorited}
          onToggleFavorite={toggle}
          favoriteError={favoriteError}
        />
      )}
    </div>
  );
}
