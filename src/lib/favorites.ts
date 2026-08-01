"use client";

import { useCallback, useEffect, useState } from "react";

const DB_NAME = "pcg-favorites";
const DB_VERSION = 1;
const STORE_NAME = "favorites";
/** Where favorites lived before the IndexedDB migration - base64 card images blew past
 *  localStorage's ~5-10MB quota after only a handful of saves. */
const LEGACY_STORAGE_KEY = "pcg-favorites";

export interface FavoriteCard {
  id: string;
  image: string;
  prompt?: string;
  pokemonNames: string;
  artType: string;
  specialForm?: string;
  vibe: string;
  savedAt: number;
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

/** Newest first. */
export async function getFavorites(): Promise<FavoriteCard[]> {
  if (typeof window === "undefined") return [];
  try {
    const db = await openDb();
    const favorites = await new Promise<FavoriteCard[]>((resolve, reject) => {
      const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result as FavoriteCard[]);
      req.onerror = () => reject(req.error);
    });
    return favorites.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
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

export async function addFavorite(card: Omit<FavoriteCard, "id" | "savedAt">): Promise<boolean> {
  try {
    if (await isImageFavorited(card.image)) return true;
    const entry: FavoriteCard = {
      ...card,
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
