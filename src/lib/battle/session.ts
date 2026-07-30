const STORAGE_PREFIX = "pcg-battle-";

export function getStoredPlayerId(code: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_PREFIX + code);
}

export function storePlayerId(code: string, playerId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + code, playerId);
}
