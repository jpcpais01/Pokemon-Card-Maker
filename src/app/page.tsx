"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Screen from "@/components/ui/Screen";
import Icon from "@/components/ui/Icon";
import { getServerMuted, isMuted, subscribe, toggleMuted } from "@/lib/audio";
import { EVENTS, eventBadge, isEventLive } from "@/lib/events";
import { getFavorites } from "@/lib/favorites";
import { useHydrated } from "@/lib/useHydrated";

interface Feature {
  href: string;
  label: string;
  tagline: string;
  badge?: string;
  /** Dropped into public/modes/. Missing files fall through to `gradient`. */
  image: string;
  gradient: string;
}

const CLASSIC_PACK: Feature = {
  href: "/solo/classic",
  label: "Classic Pack",
  tagline: "Four random traits, one AI-painted card",
  image: "/modes/classic.jpg",
  gradient: "linear-gradient(150deg, #fbbf24 0%, #ea7c0b 45%, #4a1d05 100%)",
};

/** Every running event first - they're the timely thing worth surfacing - then the normal
 *  game, as one horizontally-scrolling shelf. An event past its end date drops off entirely;
 *  `now` is null until hydration, where a stale prerender can't be trusted to know the date. */
function buildFeatured(now: number | null): Feature[] {
  const events = now === null ? EVENTS : EVENTS.filter((e) => isEventLive(e, now));
  return [
    ...events.map((e) => ({
      href: `/event/${e.slug}`,
      label: e.label,
      tagline: e.tagline,
      badge: eventBadge(e, now),
      image: e.image,
      gradient: e.gradient,
    })),
    CLASSIC_PACK,
  ];
}

const MODES = [
  { href: "/solo/sir", title: "Only SIRs", blurb: "Every pull is a Special Illustration Rare" },
  { href: "/solo/tagteam", title: "Tag Teams", blurb: "Two Pokemon share every illustration" },
  { href: "/solo/tagteamsir", title: "Tag Team SIRs", blurb: "Two Pokemon, top rarity tier" },
  { href: "/solo/tripletagteamsir", title: "Triple Tag Team SIRs", blurb: "Three Pokemon on one SIR" },
];

export default function Home() {
  const [favoriteCount, setFavoriteCount] = useState<number | null>(null);
  const now = useHydrated();
  const featured = buildFeatured(now);
  const muted = useSyncExternalStore(subscribe, isMuted, getServerMuted);

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
      <div className="flex flex-1 flex-col pt-safe">
        <header className="screen-pad enter-up flex items-center justify-between py-3">
          <div>
            <h1 className="font-display text-[28px] font-extrabold leading-none tracking-tight text-white">
              Poke<span className="gold-gradient-text">Gen</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleMuted()}
              aria-label={muted ? "Turn sound on" : "Turn sound off"}
              aria-pressed={muted}
              className="card flex h-[2.3rem] w-[2.3rem] items-center justify-center !rounded-full transition-transform active:scale-95"
            >
              <Icon
                name={muted ? "sound-off" : "sound-on"}
                size={16}
                className={muted ? "text-slate-500" : "text-slate-300"}
              />
            </button>
            <Link
              href="/gallery"
              aria-label="Open your binder"
              className="card flex items-center gap-2 !rounded-full px-3.5 py-2 transition-transform active:scale-95"
            >
              <Icon name="star-filled" size={15} className="text-amber-300" />
              <span className="text-sm font-bold tabular-nums text-white">{favoriteCount ?? "–"}</span>
            </Link>
          </div>
        </header>

        {/*
          Featured shelf. Full-bleed and snap-scrolling so a card is always
          centered and the next one peeks in at the edge - the peek is what
          tells you there's more to swipe to without needing dots or arrows.
        */}
        <div
          className="enter-up -mx-0 mt-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1"
          style={{ "--d": "60ms", scrollPaddingLeft: "1.25rem" } as React.CSSProperties}
        >
          {featured.map((f, i) => (
            <Link
              key={f.href}
              href={f.href}
              className="group relative w-[85%] flex-shrink-0 snap-start overflow-hidden rounded-3xl border border-white/12 transition-transform duration-150 active:scale-[0.985]"
              style={{
                backgroundImage: `url("${f.image}"), ${f.gradient}`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                // Without this the artwork paints under the 1px translucent
                // border, where the scrim (which only covers the padding box)
                // can't reach it - leaving a bright un-dimmed ring at the edge.
                backgroundClip: "padding-box",
                boxShadow: "inset 0 1px 0 rgb(255 255 255 / 14%), 0 20px 40px -20px rgb(0 0 0 / 90%)",
                animationDelay: `${60 + i * 60}ms`,
              }}
            >
              <div className="sheen-drift pointer-events-none absolute -inset-1/2 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
              {/* Scrim. Holds through the bottom third the text occupies, then
                  falls off quickly so most of the card is clean artwork. */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgb(0 0 0 / 94%) 0%, rgb(0 0 0 / 84%) 19%, rgb(0 0 0 / 48%) 34%, rgb(0 0 0 / 12%) 50%, transparent 64%)",
                }}
              />
              <div className="relative flex h-[15.5rem] flex-col justify-end p-4">
                {f.badge && (
                  <span className="mb-2 self-start rounded-full bg-black/55 px-2.5 py-1 text-[9.5px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                    {f.badge}
                  </span>
                )}
                <h2
                  className="font-display text-[1.7rem] font-extrabold leading-none tracking-tight text-white"
                  style={{ textShadow: "0 2px 12px rgb(0 0 0 / 65%)" }}
                >
                  {f.label}
                </h2>
                <p className="mt-1.5 text-[12.5px] leading-snug text-white/90">{f.tagline}</p>
                {/* The whole card is the target, so it just needs to say so -
                    a full-width button inside a tappable card was two
                    affordances for one action. */}
                <span className="gold-gradient-text mt-2.5 text-[11px] font-black uppercase tracking-[0.16em]">
                  Tap to play
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="screen-pad">
          <p className="section-label enter-up mb-2.5 mt-7" style={{ "--d": "160ms" } as React.CSSProperties}>
            More ways to pull
          </p>
          <div className="flex flex-col gap-2.5">
            {MODES.map((mode, i) => (
              <Link
                key={mode.href}
                href={mode.href}
                className="card enter-up group flex items-center gap-3 p-4 transition-transform duration-150 active:scale-[0.98]"
                style={{ "--d": `${200 + i * 55}ms` } as React.CSSProperties}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-white">{mode.title}</p>
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

          <Link
            href="/battle"
            className="card enter-up group mt-7 flex items-center gap-3.5 overflow-hidden p-4 transition-transform duration-150 active:scale-[0.98]"
            style={{ "--d": "420ms" } as React.CSSProperties}
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
      </div>
    </Screen>
  );
}
