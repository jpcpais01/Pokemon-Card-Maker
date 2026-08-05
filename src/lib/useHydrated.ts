"use client";

import { useSyncExternalStore } from "react";

/** Nothing to subscribe to - the value flips once, when React hydrates, and never again. */
const subscribe = () => () => {};

/**
 * The current time, or null until the browser has taken over rendering.
 *
 * Screens that expire content on a wall-clock date have a problem on a statically
 * prerendered app: the HTML is built once and can be served for weeks afterwards, so
 * anything decided by reading the clock during render is frozen at *build* time and will
 * disagree with the browser on hydration. Returning null for the server snapshot makes
 * that gap explicit - callers render the timeless version first, then the real answer
 * once mounted - instead of shipping markup that quietly lies about the date.
 */
export function useHydrated(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => Date.now(),
    () => null
  );
}
