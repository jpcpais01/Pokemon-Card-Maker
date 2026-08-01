"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFavorites } from "@/lib/favorites";

interface ModeTileProps {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
}

function ModeTile({ href, icon, title, subtitle }: ModeTileProps) {
  return (
    <Link
      href={href}
      className="glass flex items-center gap-3.5 rounded-2xl border border-white/10 p-3.5 transition-all duration-150 active:scale-[0.97] active:border-amber-300/40"
    >
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-2xl">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="truncate text-xs text-slate-400">{subtitle}</p>
      </div>
    </Link>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 first:mt-0">
      {children}
    </p>
  );
}

export default function Home() {
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getFavorites().then((favs) => {
      if (!cancelled) setFavoriteCount(favs.length);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="glass w-full max-w-sm rounded-[2rem] p-6 shadow-2xl shadow-black/40">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-300/90">PokeGen</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">Choose Your Mode</h1>
          </div>
          <Link
            href="/gallery"
            aria-label="My Binder"
            className="glass flex h-11 min-w-11 flex-shrink-0 items-center justify-center gap-1 rounded-xl px-2.5 text-amber-300 active:scale-95"
          >
            <span className="text-lg">★</span>
            {favoriteCount > 0 && <span className="text-xs font-bold">{favoriteCount}</span>}
          </Link>
        </div>

        <SectionLabel>Solo</SectionLabel>
        <div className="flex flex-col gap-2.5">
          <ModeTile href="/solo/classic" icon="🎴" title="Open a Pack" subtitle="Random art, form & vibe" />
          <ModeTile href="/solo/sir" icon="💎" title="Only SIRs" subtitle="Every pull is a Special Illustration Rare" />
          <ModeTile href="/solo/tagteam" icon="🤝" title="Tag Teams" subtitle="Every pull pairs up two Pokemon" />
        </div>

        <SectionLabel>Battle</SectionLabel>
        <div className="flex flex-col gap-2.5">
          <ModeTile href="/battle" icon="⚔️" title="Battle a Friend" subtitle="Create or join a room" />
          <ModeTile href="/bot" icon="🤖" title="Battle a Bot" subtitle="1-3 CPU opponents, your rules" />
        </div>
      </div>
    </div>
  );
}
