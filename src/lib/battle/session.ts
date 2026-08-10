const STORAGE_PREFIX = "pcg-battle-";

export function getStoredPlayerId(code: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_PREFIX + code);
}

export function storePlayerId(code: string, playerId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + code, playerId);
}

const NICKNAME_KEY = "pcg-nickname";

export function getStoredNickname(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NICKNAME_KEY) ?? "";
}

/**
 * Remembers the name to offer next time. Written only once a match actually starts, so a name
 * abandoned half-typed on a screen someone backed out of never becomes their default.
 */
export function storeNickname(nickname: string): void {
  if (typeof window === "undefined" || !nickname) return;
  window.localStorage.setItem(NICKNAME_KEY, nickname);
}
