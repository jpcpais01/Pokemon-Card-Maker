"use client";

import { useState } from "react";
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
      <div className="w-full max-w-sm">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
          Your Card
        </p>
        <h1 className="mt-1 text-center text-2xl font-black text-white">{title}</h1>

        <div className="mt-5 flex flex-wrap justify-center gap-1.5 text-[11px] font-semibold">
          <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-amber-300">{data.artType.label}</span>
          {data.specialForm.value !== "none" && (
            <span className="rounded-full bg-purple-400/15 px-2.5 py-1 text-purple-300">
              {data.specialForm.label}
            </span>
          )}
          {data.region.value !== "default" && (
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-emerald-300">
              {data.region.label}
            </span>
          )}
        </div>

        <div
          className={`relative mt-5 overflow-hidden rounded-2xl border-2 border-amber-300/50 shadow-2xl shadow-black/40 transition-opacity ${
            regenerating ? "opacity-40" : "opacity-100"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={`${title} illustration`} className="w-full" />
          {regenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowPrompt((v) => !v)}
          className="mt-4 w-full text-center text-xs font-semibold text-slate-500 active:text-slate-300"
        >
          {showPrompt ? "Hide" : "View"} generated art prompt
        </button>
        {showPrompt && (
          <p className="mt-2 rounded-lg bg-slate-800/60 p-3 text-xs leading-relaxed text-slate-400">
            {prompt}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={download}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition-transform active:scale-[0.98]"
          >
            Download Image
          </button>
          <button
            type="button"
            onClick={onRegenerateImage}
            disabled={regenerating}
            className="w-full rounded-xl border border-slate-700 py-3.5 text-sm font-semibold text-slate-200 transition-colors active:bg-slate-800 disabled:opacity-50"
          >
            Regenerate artwork
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="w-full rounded-xl border border-slate-700 py-3.5 text-sm font-semibold text-slate-200 transition-colors active:bg-slate-800"
          >
            Open a New Pack
          </button>
        </div>
      </div>
    </div>
  );
}
