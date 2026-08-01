"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getFavorites } from "@/lib/favorites";

/** Persistent top bar shown on every route: brand mark + contextual back on the left, binder
 *  (favorites) access on the right - so navigation and the favorites count are always reachable
 *  instead of being reimplemented per page. Back always goes home rather than router.back(),
 *  since routes are frequently opened as fresh deep links (e.g. a shared battle invite) with no
 *  reliable browser history to go back to. */
export default function AppShell() {
  const pathname = usePathname();
  const [favoriteCount, setFavoriteCount] = useState(0);
  const isHome = pathname === "/";
  const isGallery = pathname === "/gallery";

  useEffect(() => {
    let cancelled = false;
    getFavorites().then((favs) => {
      if (!cancelled) setFavoriteCount(favs.length);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="glass mx-auto flex h-14 w-full max-w-md items-center justify-between rounded-2xl px-2.5">
        <div className="flex items-center gap-1">
          {!isHome && (
            <Link
              href="/"
              aria-label="Go home"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg text-slate-300 active:scale-95 active:bg-white/10"
            >
              ‹
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2 rounded-xl px-1.5 py-1 active:scale-95">
            <span className="brand-gradient flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-sm font-black text-white shadow-md shadow-fuchsia-500/20">
              P
            </span>
            <span className="font-display text-sm font-bold tracking-tight text-white">PokeGen</span>
          </Link>
        </div>

        <Link
          href="/gallery"
          aria-label="My Binder"
          className={`flex h-9 min-w-9 flex-shrink-0 items-center justify-center gap-1 rounded-xl px-2.5 transition-colors active:scale-95 ${
            isGallery ? "bg-amber-400/15 text-amber-300" : "text-amber-300/90 active:bg-white/10"
          }`}
        >
          <span className="text-base">★</span>
          {favoriteCount > 0 && <span className="text-xs font-bold">{favoriteCount}</span>}
        </Link>
      </div>
    </header>
  );
}
