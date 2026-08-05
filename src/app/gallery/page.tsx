"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ImageLightbox from "@/components/ImageLightbox";
import TraitChip from "@/components/TraitChip";
import Screen from "@/components/ui/Screen";
import Icon from "@/components/ui/Icon";
import { backfillThumbnail, getFavorites, removeFavoriteByImage, type FavoriteCard } from "@/lib/favorites";

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

      // Self-heal older entries saved before thumbnails existed - runs after the initial paint,
      // one at a time, and just swaps each tile over to its thumbnail once ready. Doesn't block or
      // change anything on screen right now, but the binder gets lighter to open every time after.
      for (const fav of favs) {
        if (fav.thumbnail) continue;
        backfillThumbnail(fav).then((thumbnail) => {
          if (cancelled || !thumbnail) return;
          setFavorites((prev) => prev.map((f) => (f.id === fav.id ? { ...f, thumbnail } : f)));
        });
      }
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
  const sirCount = favorites.filter((f) => f.artType === "Special Illustration Rare").length;

  return (
    <Screen bare>
      <div className="screen-pad flex flex-1 flex-col pt-safe">
        <header className="enter-up py-3">
          <h1 className="font-display text-[28px] font-extrabold leading-none tracking-tight text-white">
            My Binder
          </h1>
          <p className="mt-1.5 text-[13px] text-slate-400">
            {favorites.length > 0
              ? `${favorites.length} card${favorites.length === 1 ? "" : "s"} saved${
                  sirCount > 0 ? ` · ${sirCount} SIR${sirCount === 1 ? "" : "s"}` : ""
                }`
              : "Cards you star show up here"}
          </p>
        </header>

        {!loaded ? null : favorites.length === 0 ? (
          <div className="card-raised pop-in mt-6 flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-500">
              <Icon name="binder" size={28} />
            </span>
            <p className="font-display text-xl font-extrabold text-white">Your binder is empty</p>
            <p className="mt-1.5 max-w-[16rem] text-[13px] leading-relaxed text-slate-400">
              Open a pack, then tap the star on any card you want to keep.
            </p>
            <Link href="/" className="btn-primary mt-6 w-full max-w-[14rem]">
              <Icon name="sparkles" size={16} />
              Open a Pack
            </Link>
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-3">
            {favorites.map((f, i) => {
              const isSir = f.artType === "Special Illustration Rare";
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOpenImage(f.image)}
                  style={{ "--d": `${Math.min(i, 10) * 45}ms` } as React.CSSProperties}
                  className={`enter-up card overflow-hidden !rounded-2xl p-0 text-left transition-transform duration-150 active:scale-[0.97] ${
                    isSir ? "!border-amber-300/45" : ""
                  }`}
                >
                  <div className="relative aspect-[3/4] w-full bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.thumbnail ?? f.image}
                      alt={f.pokemonNames}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                    {isSir && <div className="holo-sheen opacity-40" />}
                    {isSir && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-amber-300 backdrop-blur-sm">
                        SIR
                      </span>
                    )}
                  </div>
                  <div className="px-2 py-2">
                    <p className="truncate text-center text-[12px] font-bold text-white">{f.pokemonNames}</p>
                    <div className="mt-1.5 flex flex-wrap justify-center gap-1">
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
          holo={openCard.artType === "Special Illustration Rare"}
          isFavorited
          onToggleFavorite={() => handleRemove(openCard.image)}
        />
      )}
    </Screen>
  );
}
