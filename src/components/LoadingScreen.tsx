"use client";

import Link from "next/link";

interface Props {
  message: string;
  /** Shows a gentle "taking longer than expected" nudge with a retry/leave option - only used by
   *  the battle flow, which can genuinely stall waiting on another player's generation. */
  stuck?: boolean;
  onRetry?: () => void;
  retryBusy?: boolean;
  leaveHref?: string;
  leaveLabel?: string;
}

/** Hand-tuned rather than Math.random() - random values computed during render aren't pure
 *  (flagged by react-hooks/purity even inside useMemo), and a fixed scattered-looking layout
 *  reads identically to a random one for decorative particles like these. */
const PARTICLES = [
  { left: 18, size: 3, delay: 0, duration: 5.2 },
  { left: 82, size: 4, delay: 0.7, duration: 6.0 },
  { left: 34, size: 2, delay: 1.4, duration: 4.6 },
  { left: 66, size: 4, delay: 2.1, duration: 6.6 },
  { left: 47, size: 3, delay: 0.3, duration: 5.4 },
  { left: 24, size: 3, delay: 2.8, duration: 6.2 },
  { left: 75, size: 2, delay: 3.4, duration: 4.9 },
  { left: 55, size: 3, delay: 4.0, duration: 5.7 },
  { left: 12, size: 4, delay: 1.7, duration: 7.0 },
  { left: 90, size: 2, delay: 1.0, duration: 5.1 },
  { left: 40, size: 3, delay: 4.6, duration: 6.4 },
  { left: 60, size: 3, delay: 3.1, duration: 5.5 },
  { left: 28, size: 2, delay: 5.2, duration: 6.1 },
  { left: 71, size: 3, delay: 4.3, duration: 4.8 },
];

/**
 * Full-viewport "the card is being painted" animation, used for every generation wait in the app
 * (solo pack drafting/painting, battle prompting/imaging/judging, initial match load).
 *
 * Deliberately depicts the thing being made - a 3:4 card catching a holo sweep, traced by two
 * arcs with motes drifting past - rather than a generic spinner, so a long wait reads as the
 * artwork being conjured. No boxed panel; see the `.wait-*` rules in globals.css for why every
 * layer is transform/opacity only.
 */
export default function LoadingScreen({ message, stuck, onRetry, retryBusy, leaveHref, leaveLabel = "Leave Match" }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-10 overflow-hidden bg-[#07070c] px-6">
      <div aria-hidden className="wait-aura pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full" />

      <div aria-hidden className="pointer-events-none absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="wait-particle absolute bottom-[34%] rounded-full bg-gradient-to-b from-amber-100/90 to-fuchsia-300/70"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="relative flex h-56 w-56 flex-shrink-0 items-center justify-center">
        <div className="wait-arc absolute inset-0 rounded-full" />
        <div className="wait-arc-2 absolute inset-[11%] rounded-full" />

        {/* Motes ride rotating frames rather than animating along a path. */}
        <div className="wait-orbit absolute inset-0">
          <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_10px_2px_rgba(251,191,36,0.7)]" />
        </div>
        <div className="wait-orbit-rev absolute inset-[11%]">
          <span className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_9px_2px_rgba(103,232,249,0.65)]" />
        </div>

        {/* The card being painted - 3:4, matching a real pull. */}
        <div className="wait-card relative h-[6.5rem] w-[4.875rem] overflow-hidden rounded-lg">
          <div className="wait-card-glow absolute inset-0" />
          <div className="wait-card-sheen absolute -inset-1/2" />
        </div>
      </div>

      <p key={message} className="rise-in max-w-[17rem] text-center text-[15px] font-semibold leading-relaxed text-slate-100">
        {message}
      </p>

      {stuck && (
        <div className="rise-in flex flex-col items-center gap-3">
          <p className="text-xs text-amber-300">This is taking longer than expected.</p>
          <div className="flex items-center gap-4">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={retryBusy}
                className="btn-primary !px-6 !py-2.5 disabled:opacity-50"
              >
                Try Again
              </button>
            )}
            {leaveHref && (
              <Link href={leaveHref} className="btn-quiet">
                {leaveLabel}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
