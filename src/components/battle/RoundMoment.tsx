"use client";

import type { CSSProperties } from "react";
import type { RoundMoment as Moment, RoundMomentKind } from "@/lib/battle/roundMoment";

/**
 * The beat between the scorecard and the winner reveal: one animated card naming what this round
 * will be remembered for.
 *
 * Each kind gets its own piece of art rather than a shared template with the wording swapped, but
 * they are all built the same cheap way - a handful of plain divs driven by the `.moment-*`
 * keyframes in globals.css, which only ever touch `transform` and `opacity`. No canvas, no SVG
 * filters, no per-frame JavaScript, nothing looping: the whole card is a one-shot the compositor
 * runs on its own, which is what keeps it smooth on a low-end phone in a ten-player match.
 */

interface Palette {
  /** Tailwind gradient stops for the art's primary element. */
  fill: string;
  /** Border/edge tone. */
  edge: string;
  /** Title colour. */
  text: string;
  /** Backdrop wash behind the art box. */
  wash: string;
}

const PALETTES: Record<RoundMomentKind, Palette> = {
  "clean-sweep": {
    fill: "from-emerald-500 to-teal-300",
    edge: "border-emerald-300/60",
    text: "text-emerald-200",
    wash: "from-emerald-500/20",
  },
  "photo-finish": {
    fill: "from-sky-500 to-cyan-200",
    edge: "border-sky-300/60",
    text: "text-sky-200",
    wash: "from-sky-500/20",
  },
  "perfect-ten": {
    fill: "from-amber-500 to-yellow-200",
    edge: "border-amber-300/60",
    text: "text-amber-200",
    wash: "from-amber-500/20",
  },
  landslide: {
    fill: "from-rose-500 to-orange-300",
    edge: "border-rose-300/60",
    text: "text-rose-200",
    wash: "from-rose-500/20",
  },
  verdict: {
    fill: "from-violet-500 to-indigo-300",
    edge: "border-violet-300/60",
    text: "text-violet-200",
    wash: "from-violet-500/20",
  },
};

export default function RoundMomentScreen({ moment, onSkip }: { moment: Moment; onSkip: () => void }) {
  const palette = PALETTES[moment.kind];

  return (
    <div
      onClick={onSkip}
      className="fixed inset-0 z-40 flex cursor-pointer flex-col items-center justify-center gap-8 bg-[#07070c] px-6"
    >
      <div className="moment-in flex flex-col items-center gap-6">
        <div
          className={`relative flex h-[168px] w-[248px] items-center justify-center overflow-hidden rounded-3xl border bg-gradient-to-b to-transparent ${palette.edge} ${palette.wash}`}
        >
          <MomentArt kind={moment.kind} palette={palette} />
        </div>

        <div className="text-center">
          <p
            className={`moment-title font-display text-[30px] font-black uppercase leading-none tracking-tight ${palette.text}`}
          >
            {moment.title}
          </p>
          <p className="moment-detail mt-2.5 text-[13px] font-semibold text-slate-400">{moment.detail}</p>
        </div>
      </div>

      <p className="text-[11px] font-semibold text-slate-600">Tap to skip →</p>
    </div>
  );
}

function MomentArt({ kind, palette }: { kind: RoundMomentKind; palette: Palette }) {
  switch (kind) {
    case "clean-sweep":
      return <CleanSweepArt palette={palette} />;
    case "photo-finish":
      return <PhotoFinishArt palette={palette} />;
    case "perfect-ten":
      return <PerfectTenArt palette={palette} />;
    case "landslide":
      return <LandslideArt palette={palette} />;
    case "verdict":
      return <VerdictArt palette={palette} />;
  }
}

/**
 * Clean Sweep - a bar of light wipes across four category pips, lighting each one as it passes.
 * The stagger is pure `animation-delay`, so the pips are not being driven by anything.
 */
function CleanSweepArt({ palette }: { palette: Palette }) {
  return (
    <>
      <div className="flex gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{ animationDelay: `${360 + i * 130}ms` }}
            className={`moment-pip h-11 w-11 rounded-xl bg-gradient-to-br ${palette.fill}`}
          />
        ))}
      </div>
      <span className="moment-sweep pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </>
  );
}

/**
 * Photo Finish - two runners rush the line and all but dead-heat, then the shutter fires.
 * The bars are scaled on the X axis from a fixed track rather than having their width animated.
 */
function PhotoFinishArt({ palette }: { palette: Palette }) {
  return (
    <>
      <div className="relative h-[92px] w-[176px]">
        <span
          className={`moment-race-lead absolute left-0 top-[18px] h-5 w-full rounded-full bg-gradient-to-r ${palette.fill}`}
        />
        <span className="moment-race-chase absolute left-0 top-[54px] h-5 w-full rounded-full bg-gradient-to-r from-slate-600 to-slate-400" />
        {/* Static checkered post - it is the thing being raced to, so it does not move. */}
        <span
          className="absolute right-0 top-0 h-full w-[10px] rounded-sm opacity-90"
          style={{
            backgroundImage:
              "repeating-conic-gradient(#f8fafc 0% 25%, #0f172a 0% 50%)",
            backgroundSize: "10px 10px",
          }}
        />
      </div>
      <span className="moment-flash pointer-events-none absolute inset-0 bg-white" />
    </>
  );
}

/**
 * Perfect 10 - the score lands out of the frame, and two rings go out from where it hit.
 *
 * An earlier version threw shards off the impact as well. They were dropped: at the speed the
 * slam needs to land, they cleared the glyph and faded within a couple of frames, so they cost
 * four more animated nodes to produce something nobody could actually see.
 */
function PerfectTenArt({ palette }: { palette: Palette }) {
  return (
    <>
      <span
        style={{ animationDelay: "560ms" }}
        className={`moment-ring pointer-events-none absolute h-24 w-24 rounded-full border-2 ${palette.edge}`}
      />
      <span
        style={{ animationDelay: "700ms" }}
        className={`moment-ring pointer-events-none absolute h-24 w-24 rounded-full border ${palette.edge}`}
      />
      <span
        className={`moment-slam font-display bg-gradient-to-b bg-clip-text text-[76px] font-black leading-none tracking-tighter text-transparent ${palette.fill}`}
      >
        10
      </span>
    </>
  );
}

/** Landslide - the standings come down in pieces, each slab heavier and later than the last. */
function LandslideArt({ palette }: { palette: Palette }) {
  const slabs = [
    { w: "w-[132px]", delay: 200, spin: "-9deg" },
    { w: "w-[108px]", delay: 320, spin: "7deg" },
    { w: "w-[84px]", delay: 440, spin: "-6deg" },
    { w: "w-[60px]", delay: 560, spin: "5deg" },
  ];

  return (
    <>
      <span
        style={{ animationDelay: "700ms" }}
        className={`moment-ring pointer-events-none absolute h-20 w-20 rounded-full border-2 ${palette.edge}`}
      />
      <div className="flex flex-col items-center gap-1.5">
        {slabs.map((slab, i) => (
          <span
            key={i}
            style={{ animationDelay: `${slab.delay}ms`, "--spin": slab.spin } as CSSProperties}
            className={`moment-fall h-[18px] ${slab.w} rounded-md bg-gradient-to-r ${palette.fill}`}
          />
        ))}
      </div>
    </>
  );
}

/** The Verdict - spokes snap out around a seal that stamps itself straight. */
function VerdictArt({ palette }: { palette: Palette }) {
  const spokes = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <>
      <span
        style={{ animationDelay: "540ms" }}
        className={`moment-ring pointer-events-none absolute h-20 w-20 rounded-full border ${palette.edge}`}
      />
      {/* The static rotation lives on the wrapper so the animation on the child is free to use
          transform without the two fighting over the same property. */}
      {spokes.map((angle, i) => (
        <span
          key={angle}
          style={{ transform: `rotate(${angle}deg)` }}
          className="pointer-events-none absolute flex h-[132px] w-[132px] items-start justify-center"
        >
          <span
            style={{ animationDelay: `${300 + i * 45}ms` }}
            className={`moment-spoke h-6 w-[3px] rounded-full bg-gradient-to-b ${palette.fill}`}
          />
        </span>
      ))}
      <span
        className={`moment-seal flex h-16 w-16 items-center justify-center rounded-full border-2 bg-gradient-to-br ${palette.edge} ${palette.fill}`}
      >
        <span className="font-display text-[22px] font-black leading-none text-slate-900">✓</span>
      </span>
    </>
  );
}
