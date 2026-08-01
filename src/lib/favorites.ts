"use client";

import { useCallback, useState } from "react";

const STORAGE_KEY = "pcg-favorites";

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

function readAll(): FavoriteCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(favorites: FavoriteCard[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    return true;
  } catch {
    // Quota exceeded, storage disabled, or private-browsing restrictions - fail soft.
    return false;
  }
}

/** Newest first. */
export function getFavorites(): FavoriteCard[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function isImageFavorited(image: string): boolean {
  return readAll().some((f) => f.image === image);
}

export function addFavorite(card: Omit<FavoriteCard, "id" | "savedAt">): boolean {
  const favorites = readAll();
  if (favorites.some((f) => f.image === card.image)) return true;
  const entry: FavoriteCard = { ...card, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, savedAt: Date.now() };
  return writeAll([...favorites, entry]);
}

export function removeFavoriteByImage(image: string): void {
  writeAll(readAll().filter((f) => f.image !== image));
}

/**
 * Tracks whether one specific image is currently favorited and exposes a toggle. localStorage
 * isn't reactive on its own, so `isFavorited` is read fresh on every render (cheap - a small
 * JSON blob) and `version` is bumped after a mutation purely to force that re-read.
 */
export function useFavoriteToggle(image: string | null, cardInfo: Omit<FavoriteCard, "id" | "savedAt" | "image"> | null) {
  const [, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isFavorited = image ? isImageFavorited(image) : false;

  const toggle = useCallback(() => {
    if (!image || !cardInfo) return;
    setError(null);
    if (isImageFavorited(image)) {
      removeFavoriteByImage(image);
      setVersion((v) => v + 1);
      return;
    }
    const ok = addFavorite({ image, ...cardInfo });
    if (ok) {
      setVersion((v) => v + 1);
    } else {
      setError("Couldn't save - storage is full. Remove a favorite to free up space.");
    }
  }, [image, cardInfo]);

  return { isFavorited, toggle, error };
}
