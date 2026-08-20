"use client";

import { useEffect, useRef, useState } from "react";
import { playAlarm } from "@/lib/audio";

/**
 * The Deep Dive clock, as something you feel rather than read.
 *
 * A Deep Dive buys sixty seconds of unlimited rerolls and then locks the pick whether you were
 * ready or not, so the last thing it should be is a quiet number in a corner. At each milestone
 * the whole screen is taken over for about a second: the count slams in over a red wash while a
 * shockwave goes out past the edges, and it comes back harder the closer the buzzer gets - amber
 * and composed at thirty, red and shaking by five, once every second for the last five.
 *
 * Deliberately `pointer-events-none` throughout. The player is rerolling against a clock; an
 * overlay that ate a tap while telling them to hurry would be an unforgivable thing to build.
 *
 * Everything animated here is transform and opacity only, on a handful of nodes, one-shot per
 * milestone - the same rule the holo card and the score bars follow, so a panicking phone in a
 * ten-player match still has frames to spare.
 */

/** Seconds that get the full-screen treatment. The last five run back to back. */
const MILESTONES = [30, 20, 15, 10, 5, 4, 3, 2, 1, 0];

/** How long one takeover holds. Just under a second, so the final five chain without a gap. */
const FLASH_MS = 900;

/** Under this, the screen keeps a red vignette between flashes instead of only pulsing at them. */
const DREAD_FROM = 10;

type Tier = "warn" | "danger" | "critical";

function tierFor(seconds: number): Tier {
  if (seconds > DREAD_FROM) return "warn";
  return seconds > 5 ? "danger" : "critical";
}

function remaining(until: number): number {
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

export default function DeepDiveCountdown({ until }: { until: number }) {
  const [secondsLeft, setSecondsLeft] = useState(() => remaining(until));
  const [flash, setFlash] = useState<number | null>(null);
  /** Milestones already spent, so a 250ms tick can't fire the same one four times. */
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    firedRef.current = new Set();

    // Four times a second, not once: on a one-second interval a slow frame can step straight
    // over a milestone and skip its flash entirely. The count itself only re-renders when the
    // whole second actually changes.
    let id = 0;
    const tick = () => {
      const next = remaining(until);
      setSecondsLeft((prev) => (prev === next ? prev : next));

      if (MILESTONES.includes(next) && !firedRef.current.has(next)) {
        firedRef.current.add(next);
        playAlarm();
        setFlash(next);
        window.setTimeout(() => setFlash((current) => (current === next ? null : current)), FLASH_MS);
      }

      // Nothing left to count. The pick has locked itself by now and this component is about to
      // go with the picking phase, but there is no reason to keep a timer alive until it does.
      if (next === 0) window.clearInterval(id);
    };

    tick();
    id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [until]);

  const tier = tierFor(secondsLeft);
  const dread = secondsLeft <= DREAD_FROM && secondsLeft > 0;

  return (
    <>
      {/* Standing dread for the last ten seconds - always there, breathing, under everything. */}
      {dread && <div className={`dd-vignette dd-${tier} pointer-events-none fixed inset-0 z-50`} />}

      {flash !== null && (
        <div
          key={flash}
          aria-hidden
          className={`dd-flash dd-${tierFor(flash)} pointer-events-none fixed inset-0 z-[60] flex items-center justify-center`}
        >
          <span className="dd-ring" />
          <span className="dd-ring dd-ring-late" />
          {/* Shake lives on the wrapper and the slam on the child, so the two never fight over
              the same transform. */}
          <span className={flash <= 5 ? "dd-shake" : undefined}>
            {flash === 0 ? (
              <span className="dd-number font-display block px-6 text-center text-[13vw] font-black uppercase leading-[0.95] tracking-tight">
                Locked
                <br />
                In
              </span>
            ) : (
              <span className="dd-number font-display block text-[42vw] font-black leading-none tabular-nums">
                {flash}
              </span>
            )}
          </span>
          <span className="dd-caption font-display absolute bottom-[18vh] text-[13px] font-black uppercase tracking-[0.4em]">
            {flash === 0 ? "Time" : flash <= 5 ? "Lock imminent" : "Deep Dive"}
          </span>
        </div>
      )}
    </>
  );
}
