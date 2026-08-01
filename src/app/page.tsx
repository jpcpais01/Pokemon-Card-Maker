"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFavorites } from "@/lib/favorites";

interface ModeTileProps {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
  tone: "gold" | "brand";
  delay: number;
}

function ModeTile({ href, icon, title, subtitle, tone, delay }: ModeTileProps) {
  return (
    <Link
      href={href}
      style={{ animationDelay: `${delay}ms` }}
      className="glass rise-in group flex items-center gap-3.5 rounded-2xl border border-white/10 p-3.5 transition-all duration-150 active:scale-[0.97] active:border-amber-300/40"
    >
      <span
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-2xl shadow-inner transition-transform duration-200 group-active:scale-90 ${
          tone === "gold"
            ? "bg-gradient-to-br from-amber-400/25 to-orange-500/15 shadow-amber-500/10"
            : "brand-gradient shadow-fuchsia-500/20"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="truncate text-xs text-slate-400">{subtitle}</p>
      </div>
      <span className="ml-auto flex-shrink-0 text-slate-600 transition-transform duration-150 group-active:translate-x-0.5">
        ›
      </span>
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
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-8">
      <div className="glass-strong rise-in w-full max-w-sm rounded-[2rem] p-6 shadow-2xl shadow-black/40">
        <div className="mb-6 text-center">
          <p className="brand-gradient-text text-[11px] font-bold uppercase tracking-[0.35em]">Pack Simulator</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-white">Choose Your Mode</h1>
          <p className="mt-1.5 text-sm text-slate-400">One-of-a-kind AI-painted Pokemon TCG cards.</p>
        </div>

        <Link
          href="/gallery"
          className="group relative mb-6 flex items-center gap-3.5 overflow-hidden rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 transition-all active:scale-[0.97]"
        >
          <div className="holo-sheen opacity-25" />
          <span className="brand-gradient relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-2xl shadow-lg shadow-fuchsia-500/20 transition-transform duration-200 group-active:scale-90">
            ★
          </span>
          <div className="relative min-w-0">
            <p className="text-base font-bold text-white">My Binder</p>
            <p className="text-xs text-slate-400">
              {favoriteCount > 0 ? `${favoriteCount} saved card${favoriteCount === 1 ? "" : "s"}` : "Your saved favorites"}
            </p>
          </div>
          <span className="relative ml-auto flex-shrink-0 text-slate-500 transition-transform duration-150 group-active:translate-x-0.5">
            ›
          </span>
        </Link>

        <SectionLabel>Solo</SectionLabel>
        <div className="flex flex-col gap-2.5">
          <ModeTile href="/solo/classic" icon="🎴" title="Open a Pack" subtitle="Random art, form & vibe" tone="gold" delay={0} />
          <ModeTile
            href="/solo/sir"
            icon="💎"
            title="Only SIRs"
            subtitle="Every pull is a Special Illustration Rare"
            tone="brand"
            delay={40}
          />
          <ModeTile
            href="/solo/tagteam"
            icon="🤝"
            title="Tag Teams"
            subtitle="Every pull pairs up two Pokemon"
            tone="gold"
            delay={80}
          />
          <ModeTile
            href="/solo/tagteamsir"
            icon="👑"
            title="Tag Team SIRs"
            subtitle="Every pull is a Special Illustration Rare Tag Team"
            tone="brand"
            delay={120}
          />
        </div>

        <SectionLabel>Battle</SectionLabel>
        <div className="flex flex-col gap-2.5">
          <ModeTile href="/battle" icon="⚔️" title="Battle a Friend" subtitle="Create or join a room" tone="gold" delay={160} />
          <ModeTile
            href="/bot"
            icon="🤖"
            title="Battle a Bot"
            subtitle="1-3 CPU opponents, your rules"
            tone="brand"
            delay={200}
          />
        </div>
      </div>
    </div>
  );
}
