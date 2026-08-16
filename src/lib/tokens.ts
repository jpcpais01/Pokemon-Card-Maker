"use client";

import { useSyncExternalStore } from "react";
import type { PackMode } from "./types";

/**
 * The token economy: what a pack costs to open, what a pulled card is worth, and the player's
 * balance.
 *
 * The balance lives in localStorage on the device, exactly like the nickname and the mute flag.
 * There are no accounts, so it is per-browser and freely editable by anyone who opens devtools -
 * that is a deliberate trade for now, not an oversight. Nothing here is anti-cheat; it is a
 * single-player-facing economy that gives packs a cost and pulls a payoff.
 */

const STORAGE_KEY = "pcg-tokens";

/** Enough for a hundred basic packs, or twenty full matches, before anything has to be sold. */
export const STARTING_TOKENS = 1000;

/** One basic pack: no forced traits, no curated pool. Everything else is priced against this. */
export const BASE_PACK_COST = 10;

/** A match is five rounds, and every round opens a pack. */
export const PACKS_PER_MATCH = 5;

/*
 * ---------------------------------------------------------------------------
 * Balance
 * ---------------------------------------------------------------------------
 */

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function read(): number {
  if (typeof window === "undefined") return STARTING_TOKENS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return STARTING_TOKENS;
  const value = Number(raw);
  // A corrupt or hand-edited value falls back to the starting balance rather than leaving the
  // player stuck with NaN tokens and no way to open anything.
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : STARTING_TOKENS;
}

function write(value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(value))));
  emit();
}

export function getTokens(): number {
  return read();
}

/** Deducts the cost, or returns false and changes nothing if it can't be covered. */
export function spendTokens(amount: number): boolean {
  const balance = read();
  if (amount > balance) return false;
  write(balance - amount);
  return true;
}

export function earnTokens(amount: number): void {
  write(read() + amount);
}

/** Refunds already paid out, so a reload can't collect the same one twice. */
const REFUNDS_KEY = "pcg-refunds";
/** Only the most recent are worth remembering - a match is five rounds and rooms don't come back. */
const REFUND_LEDGER_LIMIT = 60;

function readRefunds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REFUNDS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Credits a one-off refund, at most once per `key`.
 *
 * Rounds are refunded by the client that sees them fail, and the round result screen is
 * re-rendered on every poll and rebuilt from scratch on a reload - so without a record of what
 * has already been paid, a player could collect the same failed round indefinitely by refreshing.
 * Returns true only on the call that actually paid.
 */
export function claimRefund(key: string, amount: number): boolean {
  if (typeof window === "undefined") return false;
  const claimed = readRefunds();
  if (claimed.includes(key)) return false;
  window.localStorage.setItem(REFUNDS_KEY, JSON.stringify([...claimed, key].slice(-REFUND_LEDGER_LIMIT)));
  earnTokens(amount);
  return true;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab spending or earning should not leave this one showing a stale balance.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The live balance, or null until the browser has taken over rendering.
 *
 * Null on the server for the same reason `useHydrated` returns null there: this app is
 * statically prerendered, and a balance baked into build-time HTML would be a number from
 * someone else's device.
 */
export function useTokens(): number | null {
  return useSyncExternalStore(
    subscribe,
    read,
    () => null
  );
}

/*
 * ---------------------------------------------------------------------------
 * What a pack costs
 * ---------------------------------------------------------------------------
 * A pack's price is the base times one multiplier per advantage it buys. Everything priced here
 * is something that would otherwise be down to the roll: forcing the top rarity tier, forcing a
 * multi-Pokemon card, or narrowing the pool to Pokemon picked for being popular or on-theme.
 */

/** Pack modes, by what they guarantee. Special Illustration Rare is a 1-in-4 roll and Tag Team
 *  a 1-in-28 one, so guaranteeing them is worth a good deal more than the base pack. */
const PACK_MODE_MULTIPLIER: Record<PackMode, number> = {
  classic: 1,
  sir: 2.5,
  tagteam: 2,
  tagteamsir: 4,
  tripletagteamsir: 6,
};

/** Any curated pool - Best 100, an event pool, and so on. They are hand-picked to be famous or
 *  striking, which is worth real points on the judge's Fame and Art scores. */
const CURATED_POOL_MULTIPLIER = 1.5;

/** Curated pools are the negative generation ids (plus 0 for Best 100); the real generations
 *  are 1-9. See `src/lib/generations.ts`. */
function usesCuratedPool(gens: number[]): boolean {
  return gens.some((id) => id <= 0);
}

/** What one pack costs under these settings. */
export function packCost(packMode: PackMode, gens: number[]): number {
  const multiplier = PACK_MODE_MULTIPLIER[packMode] * (usesCuratedPool(gens) ? CURATED_POOL_MULTIPLIER : 1);
  return Math.round(BASE_PACK_COST * multiplier);
}

/** What a five-round match costs, charged up front. */
export function matchCost(packMode: PackMode, gens: number[]): number {
  return packCost(packMode, gens) * PACKS_PER_MATCH;
}

/*
 * ---------------------------------------------------------------------------
 * What a card sells for
 * ---------------------------------------------------------------------------
 */

/** At or below this the card is common - the judge's ordinary range, worth a token. */
const FLOOR_TOTAL = 28;
/** What the first point above the floor is worth, before doubling. */
const FIRST_STEP_VALUE = 3;

/**
 * Base value for a card the judge scored `total` out of 40.
 *
 * Flat at one token through the whole ordinary range, then doubling with every point above it:
 * 29 is 3, 30 is 6, 31 is 12, and a perfect 40 is 6144. The curve is deliberately violent -
 * the difference between a good card and a great one should be the difference between covering
 * a pack and covering a season, and at the top end a card that scores full marks in all four
 * categories is meant to be a jackpot.
 */
export function baseCardValue(total: number): number {
  if (total <= FLOOR_TOTAL) return 1;
  return FIRST_STEP_VALUE * 2 ** (total - FLOOR_TOTAL - 1);
}

/**
 * A stable number in [0, 1) derived from a card's identity.
 *
 * The price wobble has to be the same every time a given card is looked at. Rolling it fresh on
 * each render would let a player close and reopen the binder until the number came up good, so
 * it is derived from the card itself instead of from a random source - same card, same offer,
 * forever. FNV-1a: tiny, no dependencies, and more than uniform enough for a +/-15% jitter.
 */
function seededUnit(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return ((hash >>> 0) % 100000) / 100000;
}

/** How far either side of the base value an offer can land. */
const PRICE_SPREAD = 0.15;

/**
 * A short, stable identifier for a card, taken from the tail of its artwork.
 *
 * The same card has to be worth the same whether it's offered at the end of the round or in the
 * binder an hour later, so both paths have to seed the price from the same thing. The artwork is
 * the only identity a card has in both places - and the last few dozen base64 characters are as
 * unique to it as the whole string, without hashing megabytes to find that out.
 */
export function cardSeed(image: string): string {
  return image.slice(-48);
}

/**
 * What this specific card is worth right now: its base value for the rating, moved up or down by
 * as much as 15% so two cards on the same score are rarely worth exactly the same.
 *
 * `seed` should be something stable and unique to the card - its binder id, or the artwork
 * itself. Never falls below one token: every card is worth something.
 */
export function cardValue(total: number, seed: string): number {
  const spread = 1 + (seededUnit(seed) * 2 - 1) * PRICE_SPREAD;
  return Math.max(1, Math.round(baseCardValue(total) * spread));
}
