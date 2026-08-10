"use client";

import { useState, useSyncExternalStore } from "react";
import { getStoredNickname } from "./session";

/** Nothing to subscribe to - the saved name only changes when this tab writes it, on its way
 *  into a match, at which point the field is about to be unmounted anyway. */
const subscribe = () => () => {};

/**
 * The nickname field's value, seeded from the last name you played under.
 *
 * The saved name is read through `useSyncExternalStore` rather than plain state because these
 * screens are prerendered: reading localStorage during render would put a name into markup the
 * server has no way to know, and the input would disagree with itself at hydration. The server
 * snapshot is empty, and the real one arrives once the browser takes over.
 *
 * Whatever you type then wins, tracked separately and starting as null rather than "" - if it
 * were a string, clearing the field would be indistinguishable from never having touched it and
 * the saved name would spring straight back.
 */
export function useNickname(): [string, (value: string) => void] {
  const saved = useSyncExternalStore(subscribe, getStoredNickname, () => "");
  const [typed, setTyped] = useState<string | null>(null);
  return [typed ?? saved, setTyped];
}
