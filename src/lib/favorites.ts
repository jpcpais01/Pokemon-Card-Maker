"use client";

import { useCallback, useEffect, useState } from "react";

import { cardSeed, cardValue, earnTokens } from "./tokens";

const DB_NAME = "pcg-favorites";
const DB_VERSION = 1;
const STORE_NAME = "favorites";
/** Where favorites lived before the IndexedDB migration - base64 card images blew past
 *  localStorage's ~5-10MB quota after only a handful of saves. */
const LEGACY_STORAGE_KEY = "pcg-favorites";

export interface FavoriteCard {
  id: string;
  image: string;
  /**
   * Whether this was the player's own pull, rather than an opponent's card saved from a round
   * result. Only your own cards can be sold - someone else's is a keepsake, not an asset.
   *
   * Undefined on entries saved before provenance was tracked; those are treated as the player's
   * own, since until battle results were savable there was no other way for a card to get here.
   */
  mine?: boolean;
  /**
   * The judge's 0-40 total for this card, when it has one. Only battle cards are judged, so a
   * solo pull has none - and no sale price, since the price is a function of the score.
   */
  ratingTotal?: number;
  /** Price seed, captured at save time from the artwork - see `cardSeed`. Without it stored, a
   *  card offered at the end of a round and the same card in the binder would be seeded off
   *  different things and quoted different prices. */
  saleSeed?: string;
  /** Small downscaled preview for the gallery grid - rendering this instead of the full-res
   *  `image` is what keeps a binder full of saved cards from having to decode and paint dozens of
   *  multi-megapixel images at once. Entries saved before this existed lack one until backfilled
   *  (see `backfillThumbnail`), so callers should fall back to `image` when it's missing. */
  thumbnail?: string;
  prompt?: string;
  pokemonNames: string;
  artType: string;
  specialForm?: string;
  vibe: string;
  savedAt: number;
}

const THUMBNAIL_WIDTH = 320;

/** Downscales a full card image into a small JPEG for the gallery grid - the actual `image` field
 *  stays full quality for the lightbox, this is purely a lighter stand-in for the grid tile. */
function generateThumbnail(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = THUMBNAIL_WIDTH;
        const h = Math.max(1, Math.round(w * (img.naturalHeight / (img.naturalWidth || 1))));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2D canvas context unavailable.");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to build thumbnail."));
      }
    };
    img.onerror = () => reject(new Error("Image failed to load for thumbnailing."));
    img.src = src;
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(STORE_NAME)) return;
      const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
      store.createIndex("byImage", "image", { unique: false });

      // One-time migration from the old localStorage-based store, folded into the same
      // versionchange transaction as the store creation so it only ever runs once.
      try {
        const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const entry of parsed) {
              if (entry && typeof entry.id === "string") store.put(entry);
            }
          }
          window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      } catch {
        // Corrupt legacy data - nothing worth migrating.
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** A binder entry with the full-size artwork left behind in the database. */
export type FavoriteSummary = Omit<FavoriteCard, "image">;

/**
 * Every saved card, newest first, *without* its full-size image.
 *
 * The grid only ever draws `thumbnail`, but a `getAll()` would hand back every full-size data
 * URL along with it and hold the lot in memory for as long as the binder is open - megabytes
 * per card, which is what made a well-stocked binder slow to open and, on a phone, able to
 * take the tab down with it. Walking a cursor and copying out just the fields the grid needs
 * lets each full record be collected as soon as it's been read, so peak memory is one card
 * rather than all of them. The lightbox pulls the real image by id when it actually opens.
 */
export async function getFavoriteSummaries(): Promise<FavoriteSummary[]> {
  if (typeof window === "undefined") return [];
  try {
    const db = await openDb();
    const summaries = await new Promise<FavoriteSummary[]>((resolve, reject) => {
      const out: FavoriteSummary[] = [];
      const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve(out);
          return;
        }
        // Destructured out rather than deleted, so the big string is never copied into
        // anything that outlives this iteration.
        const { image, ...summary } = cursor.value as FavoriteCard;
        void image;
        out.push(summary);
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
    return summaries.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

/**
 * How many cards are in the binder. Uses IndexedDB's own count, which reads no record bodies at
 * all - the home screen only wants the number on the binder tab, and loading a shelf of
 * multi-megabyte images to call `.length` on it was the most expensive thing that screen did.
 */
export async function countFavorites(): Promise<number> {
  if (typeof window === "undefined") return 0;
  try {
    const db = await openDb();
    return await new Promise<number>((resolve, reject) => {
      const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return 0;
  }
}

/** The full-size artwork for one saved card, loaded only when something actually shows it. */
export async function getFavoriteImage(id: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const db = await openDb();
    return await new Promise<string | null>((resolve, reject) => {
      const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve((req.result as FavoriteCard | undefined)?.image ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * What the shop will pay for a saved card, or null if it isn't for sale.
 *
 * Two things make a card unsellable: it was someone else's pull, or nobody ever scored it. The
 * price is seeded on the card's binder id, so the same card is always worth the same amount no
 * matter how many times the binder is opened.
 */
export function favoriteSaleValue(
  fav: Pick<FavoriteCard, "id" | "mine" | "ratingTotal" | "saleSeed">
): number | null {
  if (fav.mine === false || fav.ratingTotal === undefined) return null;
  // Entries saved before the seed was stored fall back to their id, which is just as stable -
  // it only means those quote a different (but equally fixed) price than the round did.
  return cardValue(fav.ratingTotal, fav.saleSeed ?? fav.id);
}

/**
 * Sells a card: credits the balance and takes it out of the binder, which is the trade - the
 * artwork is gone once it's sold. Returns what it fetched, or null if it wasn't for sale.
 */
export async function sellFavorite(id: string): Promise<number | null> {
  const fav = await getFavorite(id);
  if (!fav) return null;
  const value = favoriteSaleValue(fav);
  if (value === null) return null;
  await removeFavoriteById(id);
  earnTokens(value);
  return value;
}

/** One whole entry, image included. Used by the sale path, which needs the fields the grid drops. */
async function getFavorite(id: string): Promise<FavoriteCard | null> {
  if (typeof window === "undefined") return null;
  try {
    const db = await openDb();
    return await new Promise<FavoriteCard | null>((resolve, reject) => {
      const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve((req.result as FavoriteCard | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function removeFavoriteById(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Nothing more we can do if the delete fails.
  }
}

export async function isImageFavorited(image: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const db = await openDb();
    return await new Promise<boolean>((resolve, reject) => {
      const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).index("byImage").getKey(image);
      req.onsuccess = () => resolve(req.result !== undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

export async function addFavorite(card: Omit<FavoriteCard, "id" | "savedAt" | "thumbnail">): Promise<boolean> {
  try {
    if (await isImageFavorited(card.image)) return true;
    // A missing thumbnail just means this entry falls back to the full image in the grid until
    // backfilled - not worth failing the whole save over.
    const thumbnail = await generateThumbnail(card.image).catch(() => undefined);
    const entry: FavoriteCard = {
      ...card,
      thumbnail,
      saleSeed: cardSeed(card.image),
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      savedAt: Date.now(),
    };
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    // Quota exceeded, storage disabled, or private-browsing restrictions - fail soft.
    return false;
  }
}

/** Silently upgrades one entry saved before thumbnails existed - the gallery calls this in the
 *  background for anything missing one, so a binder self-heals to the fast path over time without
 *  requiring a risky bulk migration of everyone's existing saved images. */
export async function backfillThumbnail(id: string): Promise<string | undefined> {
  try {
    const image = await getFavoriteImage(id);
    if (!image) return undefined;
    const thumbnail = await generateThumbnail(image);
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result as FavoriteCard | undefined;
        if (existing) store.put({ ...existing, thumbnail });
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return thumbnail;
  } catch {
    return undefined;
  }
}

export async function removeFavoriteByImage(image: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.index("byImage").getAllKeys(image);
      req.onsuccess = () => {
        for (const key of req.result) store.delete(key);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Nothing more we can do if the delete fails.
  }
}

/**
 * Tracks whether one specific image is currently favorited and exposes a toggle. IndexedDB reads
 * are inherently async, so `isFavorited` loads via effect (starting false until the lookup
 * resolves) rather than being derived synchronously in render.
 */
export function useFavoriteToggle(image: string | null, cardInfo: Omit<FavoriteCard, "id" | "savedAt" | "image"> | null) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!image) return;
    let cancelled = false;
    isImageFavorited(image).then((fav) => {
      if (!cancelled) setIsFavorited(fav);
    });
    return () => {
      cancelled = true;
    };
  }, [image]);

  const toggle = useCallback(async () => {
    if (!image || !cardInfo) return;
    setError(null);
    if (await isImageFavorited(image)) {
      await removeFavoriteByImage(image);
      setIsFavorited(false);
      return;
    }
    const ok = await addFavorite({ image, ...cardInfo });
    if (ok) {
      setIsFavorited(true);
    } else {
      setError("Couldn't save - storage is full. Remove a favorite to free up space.");
    }
  }, [image, cardInfo]);

  return { isFavorited, toggle, error };
}
