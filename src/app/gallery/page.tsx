"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ImageLightbox from "@/components/ImageLightbox";
import TraitChip from "@/components/TraitChip";
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

        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
            {favorites.length > 0 ? `${favorites.length} Saved Card${favorites.length === 1 ? "" : "s"}` : "Your Binder"}
          </h1>
        </div>

        {!loaded ? null : favorites.length === 0 ? (
          <div className="glass-strong rise-in mt-4 rounded-2xl px-6 py-10 text-center">
            <p className="text-3xl text-slate-600">☆</p>
            <p className="mt-3 text-sm font-semibold text-slate-300">No favorites yet</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Tap the star in a card&apos;s full view to save it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((f, i) => {
              const isSir = f.artType === "Special Illustration Rare";
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOpenImage(f.image)}
                  style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                  className={`rise-in overflow-hidden rounded-2xl border-2 text-left transition-transform active:scale-[0.97] ${
                    isSir ? "border-amber-300/50" : "border-white/10"
                  }`}
                >
                  <div className="relative aspect-[3/4] w-full bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.image} alt={f.pokemonNames} className="h-full w-full object-cover" />
                    {isSir && <div className="holo-sheen opacity-40" />}
                  </div>
                  <div className="bg-slate-900/90 px-2 py-2 text-center">
                    <p className="truncate text-xs font-bold text-white">{f.pokemonNames}</p>
                    <div className="mt-1 flex flex-wrap justify-center gap-1">
                      <TraitChip tone="gold" small>
                        {f.artType}
                      </TraitChip>
                      {f.specialForm && (
                        <TraitChip tone="violet" small>
                          {f.specialForm}
                        </TraitChip>
                      )}
                      <TraitChip tone="teal" small>
                        {f.vibe}
                      </TraitChip>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {openCard && (
        <ImageLightbox
          src={openCard.image}
          alt={openCard.pokemonNames}
          onClose={() => setOpenImage(null)}
          isFavorited
          onToggleFavorite={() => handleRemove(openCard.image)}
        />
      )}
    </div>
  );
}
