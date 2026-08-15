import type { CardKey } from "@/lib/cardFaces";
import type { EventTheme } from "@/lib/events";
import type { PackMode } from "@/lib/types";
import type { BattleRoom, JudgeMode, PowerupId } from "./types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Something went wrong.");
  return data as T;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Something went wrong.");
  return data as T;
}

export function createRoom(
  gens: number[],
  vsBot = false,
  maxPlayers = 2,
  judgeMode: JudgeMode = "ai",
  unlimitedRerolls = false,
  packMode: PackMode = "classic",
  theme?: EventTheme,
  nickname?: string
) {
  return postJson<{ code: string; playerId: string }>("/api/battle/create", {
    gens,
    vsBot,
    maxPlayers,
    judgeMode,
    unlimitedRerolls,
    packMode,
    theme,
    nickname,
  });
}

export function joinRoom(code: string, nickname?: string) {
  return postJson<{ code: string; playerId: string }>("/api/battle/join", { code, nickname });
}

export function fetchRoomState(code: string, playerId: string) {
  return getJson<{ room: BattleRoom }>(
    `/api/battle/state?code=${encodeURIComponent(code)}&playerId=${encodeURIComponent(playerId)}`
  );
}

export function rerollCard(code: string, playerId: string, cardKey: CardKey) {
  return postJson<{ room: BattleRoom }>("/api/battle/reroll", { code, playerId, cardKey });
}

export function playPowerup(code: string, playerId: string, powerup: PowerupId) {
  return postJson<{ room: BattleRoom }>("/api/battle/powerup", { code, playerId, powerup });
}

export function lockPicks(code: string, playerId: string) {
  return postJson<{ room: BattleRoom }>("/api/battle/lock", { code, playerId });
}

export function advanceRound(code: string, playerId: string) {
  return postJson<{ room: BattleRoom }>("/api/battle/advance", { code, playerId });
}

export function readyForNext(code: string, playerId: string) {
  return postJson<{ room: BattleRoom }>("/api/battle/ready", { code, playerId });
}

export function fetchBattleImage(code: string, round: number, playerId: string, requesterId: string) {
  return getJson<{ image: string }>(
    `/api/battle/image?code=${encodeURIComponent(code)}&round=${round}&playerId=${encodeURIComponent(
      playerId
    )}&requesterId=${encodeURIComponent(requesterId)}`
  );
}

export function castVote(code: string, playerId: string, slot: number) {
  return postJson<{ room: BattleRoom }>("/api/battle/vote", { code, playerId, slot });
}

export function fetchVoteImage(code: string, round: number, playerId: string, slot: number) {
  return getJson<{ image: string }>(
    `/api/battle/vote-image?code=${encodeURIComponent(code)}&round=${round}&playerId=${encodeURIComponent(
      playerId
    )}&slot=${slot}`
  );
}
