"use client";

import { useSearchParams } from "next/navigation";
import SoloPackFlow, { type SoloMode } from "@/components/SoloPackFlow";
import { parseEventTheme } from "@/lib/events";

/**
 * Thin client wrapper that reads the optional `?theme=` an event hub appends
 * when it hands off to a normal solo pack. Kept separate from SoloPackFlow so
 * the Suspense boundary `useSearchParams` needs on a static route stays at the
 * page level rather than wrapping the whole flow's state.
 */
export default function SoloPackRoute({ mode }: { mode: SoloMode }) {
  const theme = parseEventTheme(useSearchParams().get("theme"));
  return <SoloPackFlow mode={mode} theme={theme} />;
}
