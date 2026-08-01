"use client";

import { useEffect } from "react";

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
  /** The exact text-to-image prompt used to generate this artwork, shown below it when given. */
  prompt?: string;
  /** Star toggle shown next to the close button - omit both to hide it entirely (e.g. anonymous ballots). */
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  favoriteError?: string | null;
}

function downloadFilename(alt: string): string {
  const slug = alt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "pokegen-card"}.png`;
}

export default function ImageLightbox({
  src,
  alt,
  onClose,
  prompt,
  isFavorited,
  onToggleFavorite,
  favoriteError,
}: Props) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close full view"
        className="glass fixed right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex h-10 w-10 items-center justify-center rounded-full text-lg text-white active:scale-95"
      >
        ✕
      </button>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
          aria-pressed={isFavorited}
          className={`glass fixed left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex h-10 w-10 items-center justify-center rounded-full text-lg transition-colors active:scale-95 ${
            isFavorited ? "text-amber-300" : "text-white"
          }`}
        >
          {isFavorited ? "★" : "☆"}
        </button>
      )}

      <div className="flex min-h-full flex-col items-center justify-center gap-5 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-2xl"
        />

        {favoriteError && (
          <p
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-300"
          >
            {favoriteError}
          </p>
        )}

        {prompt && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-md rounded-2xl p-4 text-left"
          >
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">
              Art Prompt
            </p>
            <p className="text-xs leading-relaxed text-slate-300">{prompt}</p>
          </div>
        )}

        <a
          href={src}
          download={downloadFilename(alt)}
          onClick={(e) => e.stopPropagation()}
          className="btn-primary flex items-center justify-center gap-2 !py-3 active:scale-95"
        >
          ⤓ Download Image
        </a>
      </div>
    </div>
  );
}
