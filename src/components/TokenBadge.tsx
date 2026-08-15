"use client";

import Icon from "@/components/ui/Icon";
import { useTokens } from "@/lib/tokens";

/**
 * The player's token balance, for the top of a screen.
 *
 * Renders a dash rather than a number until hydration: the balance lives on the device, and this
 * app is statically prerendered, so a number baked into the HTML would be whatever the build
 * machine had - and would visibly correct itself a moment later on every load.
 */
export default function TokenBadge() {
  const balance = useTokens();

  return (
    <span className="chip chip-gold" aria-label={balance === null ? "Loading tokens" : `${balance} tokens`}>
      <Icon name="sparkles" size={12} />
      <span className="tabular-nums">{balance === null ? "—" : balance.toLocaleString()}</span>
    </span>
  );
}
