"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { playClick, setMenuMusic } from "@/lib/audio";

/**
 * A game is anything under `/battle/<code>` - every multiplayer and vs-bot match
 * ends up there, including the ones started from `/bot`. `/battle` itself is the
 * lobby, which is still a menu.
 *
 * Solo is the exception this can't decide from the URL: `/solo/classic` is the
 * setup screen and the pack opening at the same address, so SoloPackFlow reports
 * its own stage instead. See `useMenuMusic` there.
 */
function isGameRoute(pathname: string): boolean {
  return /^\/battle\/[^/]+$/.test(pathname);
}

/** Buttons, links and anything acting as one. Opt out with `data-no-click-sfx`. */
const CLICKABLE = 'button:not([disabled]), a[href], [role="button"]';

/**
 * Mounted once in the root layout. Owns the two things that have to be global:
 * which screens play music, and the click every button makes.
 */
export default function AppAudio() {
  const pathname = usePathname();

  useEffect(() => {
    // Solo routes are left alone here - SoloPackFlow drives those from its stage,
    // and stepping on it from the route would cut the music off mid-pack.
    if (pathname.startsWith("/solo/")) return;
    setMenuMusic(!isGameRoute(pathname));
  }, [pathname]);

  useEffect(() => {
    // One delegated listener rather than a handler per button: every control in the
    // app gets the sound for free, including ones added later.
    //
    // Bound to `click`, not `pointerdown`: the home shelf and the card binder are
    // drag-scrolled by pressing directly on links, and a press-triggered sound would
    // fire on every one of those swipes. A click only lands when the tap actually
    // activates something.
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const hit = target?.closest?.(CLICKABLE);
      if (!hit || hit.closest("[data-no-click-sfx]")) return;
      playClick();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
