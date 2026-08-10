"use client";

import type { ReactNode } from "react";
import Screen from "@/components/ui/Screen";
import Icon from "@/components/ui/Icon";
import { GENERATIONS } from "@/lib/generations";

interface Props {
  selected: number[];
  onChange: (gens: number[]) => void;
  onStart: () => void;
  loading: boolean;
  error: string | null;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  loadingLabel?: string;
  /** Back target for the header - a route string or a handler. */
  back?: string | (() => void);
  footer?: ReactNode;
  /** Rendered after the gen grid, before the start button - e.g. match settings. */
  extraTop?: ReactNode;
  /** Blocks the start button for a reason this component can't see - e.g. an unfilled
   *  nickname in `extraTop`. Pool selection is still checked here regardless. */
  startDisabled?: boolean;
  /** Shown above the title when this setup is running inside an event, so the
   *  theme stays visible while you're choosing pools and rules. */
  /** Confirms which event this setup belongs to. Label only, deliberately: you arrive here
   *  straight from the event hub, which has just shown you the blurb in full. */
  eventBanner?: { label: string; gradient: string; image?: string };
}

/** Curated pools aren't real generations and get their own group. Real generations
 *  are numbered from 1, so every hand-picked pool uses a zero-or-negative id -
 *  deriving the split from that means a new pool lands in the right group here
 *  without this file having to know it exists. */
const isCurated = (id: number) => id <= 0;

const NUMBERED = GENERATIONS.filter((g) => !isCurated(g.id));
const CURATED = GENERATIONS.filter((g) => isCurated(g.id));

export default function GenSelector({
  selected,
  onChange,
  onStart,
  loading,
  error,
  eyebrow = "Pack Setup",
  title = "Choose Your Pool",
  subtitle = "Pick which Pokemon can show up in your pack.",
  buttonLabel = "Open Pack",
  loadingLabel = "Loading Pokedex...",
  back,
  footer,
  extraTop,
  startDisabled,
  eventBanner,
}: Props) {
  const allSelected = selected.length === GENERATIONS.length;

  function toggle(id: number) {
    if (selected.includes(id)) {
      onChange(selected.filter((g) => g !== id));
    } else {
      onChange([...selected, id].sort((a, b) => a - b));
    }
  }

  function toggleAll() {
    onChange(allSelected ? [] : GENERATIONS.map((g) => g.id));
  }

  function renderGen(gen: (typeof GENERATIONS)[number]) {
    const active = selected.includes(gen.id);
    return (
      <button
        key={gen.id}
        type="button"
        onClick={() => toggle(gen.id)}
        aria-pressed={active}
        className={`seg relative flex-col !py-3 ${active ? "seg-on" : ""}`}
      >
        <span className="text-[13px] font-bold leading-tight">{gen.label}</span>
        <span className="mt-0.5 text-[10px] font-semibold leading-tight opacity-70">{gen.region}</span>
        {active && (
          <span className="absolute right-1.5 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-300/85 text-[#2a1705]">
            <Icon name="check" size={9} strokeWidth={4} />
          </span>
        )}
      </button>
    );
  }

  return (
    // Immersive: this is a drill-in setup flow with its own sticky CTA, so the
    // tab bar would both collide with that CTA and invite you to abandon the
    // flow mid-way. The header back arrow is the way out.
    <Screen immersive back={back} title={eyebrow}>
      <div className="screen-pad flex flex-1 flex-col">
        {eventBanner && (
          <div
            className="enter-up relative mb-4 mt-1 overflow-hidden rounded-2xl px-4 py-3"
            style={{
              backgroundImage: eventBanner.image
                ? `url("${eventBanner.image}"), ${eventBanner.gradient}`
                : eventBanner.gradient,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Near-opaque over the whole banner: this one is mostly text, so the
                artwork is here as texture behind it rather than as the subject. */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(105deg, rgb(0 0 0 / 82%) 0%, rgb(0 0 0 / 62%) 100%)" }}
            />
            <div className="sheen-drift pointer-events-none absolute -inset-1/2 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
            <p className="relative text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
              Event
            </p>
            <p className="font-display relative mt-0.5 text-xl font-extrabold text-white">
              {eventBanner.label}
            </p>
          </div>
        )}

        <div className="enter-up mb-6 mt-1">
          <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-400">{subtitle}</p>
        </div>

        <div className="enter-up" style={{ "--d": "60ms" } as React.CSSProperties}>
          <div className="mb-2.5 flex items-center justify-between">
            <p className="section-label">Generations</p>
            <button
              type="button"
              onClick={toggleAll}
              className="text-[12px] font-bold text-amber-300 transition-opacity active:opacity-60"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">{NUMBERED.map(renderGen)}</div>
        </div>

        <div className="enter-up mt-5" style={{ "--d": "120ms" } as React.CSSProperties}>
          <p className="section-label mb-2.5">Curated pools</p>
          <div className="grid grid-cols-3 gap-2">{CURATED.map(renderGen)}</div>
        </div>

        {extraTop && (
          <div className="enter-up mt-6 flex flex-col gap-5" style={{ "--d": "180ms" } as React.CSSProperties}>
            {extraTop}
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-center text-[13px] text-red-300">
            {error}
          </p>
        )}

        {footer}
      </div>

      {/* Sticky action rail - the primary CTA stays reachable no matter how far
          the settings list scrolls, instead of stranding it at the page bottom. */}
      <div className="sticky bottom-0 z-20 mt-7">
        <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-[#07070c] to-transparent" />
        <div
          className="screen-pad relative bg-[#07070c]"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.875rem)" }}
        >
          <button
            type="button"
            onClick={onStart}
            disabled={loading || selected.length === 0 || startDisabled}
            className="btn-primary w-full disabled:pointer-events-none disabled:opacity-40"
          >
            {loading ? (
              loadingLabel
            ) : (
              <>
                <Icon name="sparkles" size={17} />
                {buttonLabel}
              </>
            )}
          </button>
          {selected.length === 0 && (
            <p className="mt-2 text-center text-[11px] text-slate-500">Select at least one pool to continue.</p>
          )}
        </div>
      </div>
    </Screen>
  );
}
