"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ImageLightbox from "@/components/ImageLightbox";
import { getFavorites, removeFavoriteByImage, type FavoriteCard } from "@/lib/favorites";

export default function GalleryPage() {
  const [favorites, setFavorites] = useState<FavoriteCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openImage, setOpenImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getFavorites().then((favs) => {
      if (cancelled) return;
      setFavorites(favs);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRemove(image: string) {
    await removeFavoriteByImage(image);
    setFavorites((prev) => prev.filter((f) => f.image !== image));
    setOpenImage((prev) => (prev === image ? null : prev));
  }

  const openCard = favorites.find((f) => f.image === openImage) ?? null;

  return (
    <div className="flex min-h-dvh flex-col px-5 py-8">
      <div className="mx-auto w-full max-w-sm flex-1">
        <div className="glass mb-6 flex items-center justify-between rounded-2xl px-4 py-3">
          <Link href="/" className="text-sm font-semibold text-slate-300 active:text-white">
            ← Home
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">My Binder</p>
          <span className="w-10" aria-hidden />
        </div>

        {!loaded ? null : favorites.length === 0 ? (
          <div className="glass mt-10 rounded-2xl px-6 py-10 text-center">
            <p className="text-3xl text-slate-600">☆</p>
            <p className="mt-3 text-sm font-semibold text-slate-300">No favorites yet</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Tap the star in a card&apos;s full view to save it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setOpenImage(f.image)}
                className="overflow-hidden rounded-2xl border-2 border-white/10 text-left"
              >
                <div className="relative aspect-[3/4] w-full bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.image} alt={f.pokemonNames} className="h-full w-full object-cover" />
                </div>
                <div className="bg-slate-900/90 px-2 py-2 text-center">
                  <p className="truncate text-xs font-bold text-white">{f.pokemonNames}</p>
                  <div className="mt-1 flex flex-wrap justify-center gap-1">
                    <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                      {f.artType}
                    </span>
                    {f.specialForm && (
                      <span className="rounded-full bg-purple-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-purple-300">
                        {f.specialForm}
                      </span>
                    )}
                    <span className="rounded-full bg-teal-400/15 px-1.5 py-0.5 text-[9px] font-semibold text-teal-300">
                      {f.vibe}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {openCard && (
        <ImageLightbox
          src={openCard.image}
          alt={openCard.pokemonNames}
          prompt={openCard.prompt}
          onClose={() => setOpenImage(null)}
          isFavorited
          onToggleFavorite={() => handleRemove(openCard.image)}
        />
      )}
    </div>
  );
}
