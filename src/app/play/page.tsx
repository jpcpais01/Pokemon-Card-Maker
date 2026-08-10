"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ModeHub from "@/components/ModeHub";
import { PACK_MODES } from "@/lib/types";
import type { PackMode } from "@/lib/types";

function parsePackMode(value: string | null): PackMode | undefined {
  return PACK_MODES.includes(value as PackMode) ? (value as PackMode) : undefined;
}

/** The base game's hub - the same screen an event opens, minus the art direction. */
function BaseModeHub() {
  return <ModeHub pack={parsePackMode(useSearchParams().get("pack"))} />;
}

export default function PlayPage() {
  return (
    <Suspense fallback={null}>
      <BaseModeHub />
    </Suspense>
  );
}
