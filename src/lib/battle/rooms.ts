import { getJSON, getString, setJSON, setString } from "./store";
import type { BattleRoom } from "./types";

const roomKey = (code: string) => `battle:room:${code}`;
const imageKey = (code: string, round: number, playerId: string) => `battle:image:${code}:${round}:${playerId}`;
export const lockKey = (code: string) => `battle:lock:${code}`;

export function getRoom(code: string): Promise<BattleRoom | null> {
  return getJSON<BattleRoom>(roomKey(code));
}

export function saveRoom(room: BattleRoom): Promise<void> {
  return setJSON(roomKey(room.code), room);
}

export function getImage(code: string, round: number, playerId: string): Promise<string | null> {
  return getString(imageKey(code, round, playerId));
}

export function saveImage(code: string, round: number, playerId: string, image: string): Promise<void> {
  return setString(imageKey(code, round, playerId), image);
}
