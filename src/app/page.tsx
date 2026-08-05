"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Screen from "@/components/ui/Screen";
import Icon from "@/components/ui/Icon";
import { getFavorites } from "@/lib/favorites";

interface Mode {
  href: string;
  title: string;
  blurb: string;
  /** Trait emoji shown on the mode's mini card stack - content, not chrome. */
  glyph: string;
  /** Tailwind gradient stops for the tile's color identity. */
  from: string;
  to: string;
  tag?: string;
}

const FEATURED: Mode = {
  href: "/solo/classic",
  title: "Classic Pack",
  blurb: "Four random traits, one AI-painted card",
  glyph: "🎴",
  from: "from-amber-400",
  to: "to-orange-600",
};

const MODES: Mode[] = [
  {
    href: "/solo/sir",
    title: "Only SIRs",
    blurb: "Every pull is a Special Illustration Rare",
    glyph: "💎",
    from: "from-violet-500",
    to: "to-fuchsia-600",
    tag: "Rare",
  },
  {
    href: "/solo/tagteam",
    title: "Tag Teams",
    blurb: "Two Pokemon share every illustration",
    glyph: "🤝",
    from: "from-cyan-400",
    to: "to-sky-600",
  },
  {
    href: "/solo/tagteamsir",
    title: "Tag Team SIRs",
    blurb: "Two Pokemon, top rarity tier",
    glyph: "👑",
    from: "from-rose-400",
    to: "to-pink-600",
    tag: "Rare",
  },
  {
    href: "/solo/tripletagteamsir",
    title: "Triple Tag Team SIRs",
    blurb: "Three Pokemon on one SIR",
    glyph: "🫂",
    from: "from-emerald-400",
    to: "to-teal-600",
    tag: "Rare",
  },
];

/** The mini "card" that gives each mode tile a physical, collectible identity. */
function ModeGlyph({ mode, large }: { mode: Mode; large?: boolean }) {
  return (
    <span
      className={`relative flex flex-shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br ${
        mode.from
      } ${mode.to} ${large ? "h-[4.75rem] w-[3.5rem] rounded-xl text-[2rem]" : "h-14 w-[2.6rem] rounded-[0.6rem] text-2xl"}`}
      style={{ boxShadow: "inset 0 1px 0 rgb(255 255 255 / 45%), 0 8px 20px -8px rgb(0 0 0 / 80%)" }}
    >
      {/* Foil sheen across the mini card, matching the holo language used on real pulls. */}
      <span className="sheen-drift pointer-events-none absolute -inset-1/2 bg-gradient-to-tr from-transparent via-white/35 to-transparent" />
      <span className="relative drop-shadow-sm">{mode.glyph}</span>
    </span>
  );
}

export default function Home() {
  const [favoriteCount, setFavoriteCount] = useState<number | null>(null);

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
    <Screen bare>
      <div className="screen-pad flex flex-1 flex-col pt-safe">
        {/* Brand header */}
        <header className="enter-up flex items-center justify-between py-3">
          <div>
            <h1 className="font-display text-[28px] font-extrabold leading-none tracking-tight text-white">
              Poke<span className="gold-gradient-text">Gen</span>
            </h1>
            <p className="mt-1 text-[13px] text-slate-400">AI-painted trading cards</p>
          </div>
          <Link
            href="/gallery"
            aria-label="Open your binder"
            className="card flex items-center gap-2 !rounded-full px-3.5 py-2 transition-transform active:scale-95"
          >
            <Icon name="star-filled" size={15} className="text-amber-300" />
            <span className="text-sm font-bold tabular-nums text-white">{favoriteCount ?? "–"}</span>
          </Link>
        </header>

        {/* Featured mode - the primary action on the screen, sized like it. */}
        <Link
          href={FEATURED.href}
          className="card-raised enter-up group relative mt-3 overflow-hidden p-5 transition-transform duration-150 active:scale-[0.985]"
          style={{ "--d": "60ms" } as React.CSSProperties}
        >
          <div
            aria-hidden
            className="glow-pulse pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber-400/25 blur-3xl"
          />
          <div className="relative flex items-center gap-4">
            <ModeGlyph mode={FEATURED} large />
            <div className="min-w-0 flex-1">
              <p className="section-label text-amber-300/80">Start here</p>
              <p className="font-display mt-1 text-2xl font-extrabold leading-tight text-white">
                {FEATURED.title}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-slate-400">{FEATURED.blurb}</p>
            </div>
          </div>
          <div className="btn-primary relative mt-4 w-full">
            <Icon name="sparkles" size={17} />
            Open a Pack
          </div>
        </Link>

        {/* Other solo modes */}
        <p className="section-label enter-up mb-2.5 mt-7" style={{ "--d": "120ms" } as React.CSSProperties}>
          More ways to pull
        </p>
        <div className="flex flex-col gap-2.5">
          {MODES.map((mode, i) => (
            <Link
              key={mode.href}
              href={mode.href}
              className="card enter-up group flex items-center gap-3.5 p-3 transition-transform duration-150 active:scale-[0.98]"
              style={{ "--d": `${160 + i * 55}ms` } as React.CSSProperties}
            >
              <ModeGlyph mode={mode} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[15px] font-bold text-white">{mode.title}</p>
                  {mode.tag && <span className="chip chip-violet chip-sm!">{mode.tag}</span>}
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-slate-400">{mode.blurb}</p>
              </div>
              <Icon
                name="chevron-right"
                size={18}
                className="flex-shrink-0 text-slate-600 transition-transform duration-150 group-active:translate-x-0.5"
              />
            </Link>
          ))}
        </div>

        {/* Battle cross-link - lives on its own tab, but the hand-off belongs here too. */}
        <Link
          href="/battle"
          className="card enter-up group mt-7 flex items-center gap-3.5 overflow-hidden p-4 transition-transform duration-150 active:scale-[0.98]"
          style={{ "--d": "380ms" } as React.CSSProperties}
        >
          <span className="brand-gradient flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/25">
            <Icon name="swords" size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-white">Card Showdown</p>
            <p className="mt-0.5 truncate text-[12.5px] text-slate-400">
              Battle friends or bots — an AI judges every round
            </p>
          </div>
          <Icon
            name="chevron-right"
            size={18}
            className="flex-shrink-0 text-slate-600 transition-transform duration-150 group-active:translate-x-0.5"
          />
        </Link>
      </div>
    </Screen>
  );
}
