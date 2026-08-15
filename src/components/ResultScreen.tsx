"use client";

import { useState } from "react";
import HoloCard from "./HoloCard";
import ImageLightbox from "./ImageLightbox";
import TraitChip from "./TraitChip";
import Screen from "@/components/ui/Screen";
import Icon from "@/components/ui/Icon";
import type { RevealData } from "./RevealScreen";
import { useFavoriteToggle } from "@/lib/favorites";

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
  const { isFavorited, toggle, error: favoriteError } = useFavoriteToggle(image, {
    prompt,
    pokemonNames: title,
    artType: data.artType.label,
    specialForm: data.specialForm.value !== "none" ? data.specialForm.label : undefined,
    vibe: data.vibe.label,
    // A solo pull is always your own, and never scored - nothing judges a pack you opened
    // alone, so it has no sale price and lives in the binder purely as a keepsake.
    mine: true,
  });

  function download() {
    const a = document.createElement("a");
    a.href = image;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}-card.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const isSir = data.artType.label === "Special Illustration Rare";

  return (
    <Screen
      immersive
      back={onStartOver}
      title="Your Card"
      action={
        <button
          type="button"
          onClick={toggle}
          aria-label={isFavorited ? "Remove from binder" : "Save to binder"}
          aria-pressed={isFavorited}
          className={`btn-quiet -mr-2 !px-2 ${isFavorited ? "!text-amber-300" : ""}`}
        >
          <Icon name={isFavorited ? "star-filled" : "star"} size={19} />
        </button>
      }
    >
      <div className="screen-pad flex flex-1 flex-col items-center">
        {/* The card itself is the hero - everything else is subordinate to it. */}
        <div className="pop-in relative w-full max-w-[19rem]">
          {isSir && (
            <div
              aria-hidden
              className="glow-pulse pointer-events-none absolute -inset-6 rounded-[3rem] bg-amber-400/18 blur-3xl"
            />
          )}
          <button
            type="button"
            onClick={() => !regenerating && setFullView(true)}
            disabled={regenerating}
            aria-label="View full size"
            className={`group relative block w-full transition-opacity duration-300 ${
              regenerating ? "pointer-events-none opacity-40" : "opacity-100"
            }`}
          >
            <HoloCard
              src={image}
              alt={`${title} illustration`}
              holo={isSir}
              className="aspect-[3/4] w-full"
              frameClassName={`rounded-2xl border ${isSir ? "border-amber-300/55" : "border-white/15"}`}
            />
            {regenerating && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />
              </div>
            )}
            {!regenerating && (
              <span className="glass absolute bottom-2.5 right-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/90">
                <Icon name="expand" size={14} />
              </span>
            )}
          </button>
        </div>

        <div className="enter-up mt-5 w-full text-center" style={{ "--d": "120ms" } as React.CSSProperties}>
          <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-tight text-white">
            {title}
          </h1>
          <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
            <TraitChip tone="gold">{data.artType.label}</TraitChip>
            {data.specialForm.value !== "none" && <TraitChip tone="violet">{data.specialForm.label}</TraitChip>}
            <TraitChip tone="teal">{data.vibe.label}</TraitChip>
          </div>
        </div>

        {favoriteError && (
          <p className="mt-4 w-full rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-center text-[12px] text-red-300">
            {favoriteError}
          </p>
        )}

        <div
          className="enter-up mt-6 flex w-full flex-col gap-2.5"
          style={{ "--d": "200ms" } as React.CSSProperties}
        >
          <button type="button" onClick={download} className="btn-primary w-full">
            <Icon name="download" size={17} />
            Save Image
          </button>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onRegenerateImage}
              disabled={regenerating}
              className="btn-ghost flex-1 disabled:opacity-50"
            >
              <Icon name="reroll" size={16} />
              Repaint
            </button>
            <button type="button" onClick={onStartOver} className="btn-ghost flex-1">
              <Icon name="plus" size={16} />
              New Pack
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPrompt((v) => !v)}
          className="btn-quiet mt-4 w-full"
        >
          {showPrompt ? "Hide" : "View"} art prompt
        </button>
        {showPrompt && (
          <p className="card mb-4 w-full p-4 text-[12px] leading-relaxed text-slate-400">{prompt}</p>
        )}

        <div style={{ height: "calc(env(safe-area-inset-bottom) + 0.5rem)" }} />
      </div>

      {fullView && (
        <ImageLightbox
          src={image}
          alt={`${title} illustration`}
          onClose={() => setFullView(false)}
          holo={isSir}
          isFavorited={isFavorited}
          onToggleFavorite={toggle}
          favoriteError={favoriteError}
        />
      )}
    </Screen>
  );
}
