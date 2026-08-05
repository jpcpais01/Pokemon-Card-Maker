"use client";

import { useEffect } from "react";
import HoloCard from "./HoloCard";
import Icon from "@/components/ui/Icon";

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
  /** Star toggle shown next to the close button - omit both to hide it entirely (e.g. anonymous ballots). */
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  favoriteError?: string | null;
  /** Full rainbow holo foil, reserved for Special Illustration Rare - matches the tier cue used elsewhere. */
  holo?: boolean;
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
  isFavorited,
  onToggleFavorite,
  favoriteError,
  holo,
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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/92 backdrop-blur-md"
    >
      <div
        className="flex items-center justify-between px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
        {onToggleFavorite ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={isFavorited ? "Remove from binder" : "Save to binder"}
            aria-pressed={isFavorited}
            className={`glass flex h-10 w-10 items-center justify-center rounded-full transition-colors active:scale-95 ${
              isFavorited ? "text-amber-300" : "text-white"
            }`}
          >
            <Icon name={isFavorited ? "star-filled" : "star"} size={19} />
          </button>
        ) : (
          <span className="h-10 w-10" />
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close full view"
          className="glass flex h-10 w-10 items-center justify-center rounded-full text-white active:scale-95"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="flex min-h-[calc(100%-4rem)] flex-col items-center justify-center gap-5 px-5 pb-8 pt-2">
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
          <HoloCard
            src={src}
            alt={alt}
            holo={holo}
            className="aspect-[3/4] w-full"
            frameClassName="rounded-2xl border border-white/12"
          />
        </div>

        {favoriteError && (
          <p
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-center text-[12px] text-red-300"
          >
            {favoriteError}
          </p>
        )}

        <a
          href={src}
          download={downloadFilename(alt)}
          onClick={(e) => e.stopPropagation()}
          className="btn-primary w-full max-w-sm"
        >
          <Icon name="download" size={17} />
          Save Image
        </a>
      </div>
    </div>
  );
}
