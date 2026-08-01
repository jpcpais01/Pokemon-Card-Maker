"use client";

import { useState } from "react";
import ImageLightbox from "./ImageLightbox";
import type { RevealData } from "./RevealScreen";

interface Props {
  image: string;
  prompt: string;
  data: RevealData;
  onRegenerateImage: () => void;
  onStartOver: () => void;
  regenerating: boolean;
}

export default function ResultScreen({ image, prompt, data, onRegenerateImage, onStartOver, regenerating }: Props) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [fullView, setFullView] = useState(false);

  const title = data.pokemons.map((p) => p.displayName).join(" & ");

  function download() {
    const a = document.createElement("a");
    a.href = image;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}-card.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="flex min-h-dvh flex-col items-center px-5 py-8">
      <div className="glass w-full max-w-sm rounded-[2rem] p-5 shadow-2xl shadow-black/40">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-300/90">
          Your Card
        </p>
        <h1 className="mt-1 text-center text-2xl font-black tracking-tight text-white">{title}</h1>

        <div className="mt-4 flex flex-wrap justify-center gap-1.5 text-[11px] font-semibold">
          <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-amber-300">{data.artType.label}</span>
          {data.specialForm.value !== "none" && (
            <span className="rounded-full bg-purple-400/15 px-2.5 py-1 text-purple-300">
              {data.specialForm.label}
            </span>
          )}
          <span className="rounded-full bg-teal-400/15 px-2.5 py-1 text-teal-300">{data.vibe.label}</span>
        </div>

        <button
          type="button"
          onClick={() => !regenerating && setFullView(true)}
          aria-label="View full size"
          className={`group relative mt-5 aspect-[3/4] w-full overflow-hidden rounded-2xl border border-amber-300/40 bg-black/20 shadow-xl shadow-black/40 transition-opacity ${
            regenerating ? "opacity-40" : "opacity-100"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={`${title} illustration`} className="h-full w-full object-cover" />
          {regenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            </div>
          )}
          {!regenerating && (
            <span className="glass absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full text-sm text-white opacity-90 transition-opacity group-active:opacity-100">
              ⤢
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowPrompt((v) => !v)}
          className="mt-4 w-full text-center text-xs font-semibold text-slate-400 active:text-slate-200"
        >
          {showPrompt ? "Hide" : "View"} generated art prompt
        </button>
        {showPrompt && (
          <p className="glass mt-2 rounded-xl p-3 text-xs leading-relaxed text-slate-300">{prompt}</p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={download}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98]"
          >
            Download Image
          </button>
          <button
            type="button"
            onClick={onRegenerateImage}
            disabled={regenerating}
            className="glass w-full rounded-2xl py-3.5 text-sm font-semibold text-slate-200 transition-colors active:bg-white/10 disabled:opacity-50"
          >
            Regenerate artwork
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="glass w-full rounded-2xl py-3.5 text-sm font-semibold text-slate-200 transition-colors active:bg-white/10"
          >
            Open a New Pack
          </button>
        </div>
      </div>

      {fullView && (
        <ImageLightbox src={image} alt={`${title} illustration`} onClose={() => setFullView(false)} />
      )}
    </div>
  );
}
