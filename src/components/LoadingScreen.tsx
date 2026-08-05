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
  { left: 18, size: 4, delay: 0, duration: 3.6 },
  { left: 82, size: 5, delay: 0.4, duration: 4.2 },
  { left: 34, size: 3, delay: 0.8, duration: 3.2 },
  { left: 66, size: 6, delay: 1.2, duration: 4.8 },
  { left: 47, size: 4, delay: 0.2, duration: 3.8 },
  { left: 24, size: 5, delay: 1.6, duration: 4.4 },
  { left: 75, size: 3, delay: 2.0, duration: 3.4 },
  { left: 55, size: 4, delay: 2.4, duration: 4.0 },
  { left: 12, size: 6, delay: 1.0, duration: 5.0 },
  { left: 90, size: 3, delay: 0.6, duration: 3.6 },
  { left: 40, size: 5, delay: 2.8, duration: 4.6 },
  { left: 60, size: 4, delay: 1.8, duration: 3.9 },
  { left: 28, size: 3, delay: 3.2, duration: 4.3 },
  { left: 71, size: 5, delay: 2.6, duration: 3.5 },
];

/**
 * Full-viewport "something is being conjured" animation used for every generation wait in the
 * app (solo pack drafting/painting, battle prompting/imaging/judging, initial match load) - no
 * boxed panel, just a materializing core built entirely from transform/opacity animations so it
 * stays smooth regardless of device or how long it plays.
 */
export default function LoadingScreen({ message, stuck, onRetry, retryBusy, leaveHref, leaveLabel = "Leave Match" }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-10 overflow-hidden bg-[#07070c] px-6">
      <div aria-hidden className="wait-aura pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full" />

      <div aria-hidden className="pointer-events-none absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="wait-particle absolute bottom-[38%] rounded-full bg-gradient-to-b from-amber-200 to-fuchsia-300"
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

      <div className="relative flex h-44 w-44 flex-shrink-0 items-center justify-center">
        <div className="wait-ring-outer absolute inset-0 rounded-full" />
        <div className="wait-ring-inner absolute inset-5 rounded-full" />
        <div className="wait-core absolute inset-12 rounded-full" />
        <span className="relative text-4xl drop-shadow-[0_0_12px_rgba(0,0,0,0.4)]">✨</span>
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
