"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GenSelector from "@/components/GenSelector";
import JudgeModePicker from "@/components/battle/JudgeModePicker";
import NicknameField, { isNicknameUsable } from "@/components/battle/NicknameField";
import PackModePicker from "@/components/battle/PackModePicker";
import PlayerCountPicker from "@/components/battle/PlayerCountPicker";
import { createRoom } from "@/lib/battle/api";
import { storeNickname, storePlayerId } from "@/lib/battle/session";
import { useNickname } from "@/lib/battle/useNickname";
import { getEvent, parseEventTheme } from "@/lib/events";
import { GENERATIONS } from "@/lib/generations";
import { matchCost, spendTokens } from "@/lib/tokens";
import { MIN_VOTE_PLAYERS, type JudgeMode } from "@/lib/battle/types";
import { PACK_MODES, type PackMode } from "@/lib/types";

function parsePackMode(value: string | null): PackMode {
  return PACK_MODES.includes(value as PackMode) ? (value as PackMode) : "classic";
}

/**
 * Setting up a room to play against friends.
 *
 * This used to open on a three-option menu - create, join, battle a bot - which every mode's
 * hub now offers directly, so the menu was three rows deep in a section duplicating them.
 * You arrive here from a hub having already said "vs Friends", and joining someone else's
 * room is a sheet on the home screen.
 */
function CreateRoom() {
  const router = useRouter();
  const params = useSearchParams();
  const theme = parseEventTheme(params.get("theme"));
  const event = getEvent(theme);

  const [gens, setGens] = useState<number[]>(event ? event.defaultGens : GENERATIONS.map((g) => g.id));
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [judgeMode, setJudgeMode] = useState<JudgeMode>("ai");
  const [packMode, setPackMode] = useState<PackMode>(parsePackMode(params.get("pack")));
  const [nickname, setNickname] = useNickname();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate() {
    setCreateError(null);
    setCreating(true);
    try {
      const effectiveJudgeMode = maxPlayers >= MIN_VOTE_PLAYERS ? judgeMode : "ai";
      // A match is five rounds and so five packs, charged up front.
      if (!spendTokens(matchCost(packMode, gens))) {
        throw new Error("Not enough tokens to start this match.");
      }
      const { code, playerId } = await createRoom(
        gens,
        false,
        maxPlayers,
        effectiveJudgeMode,
        false,
        packMode,
        theme,
        nickname
      );
      storePlayerId(code, playerId);
      storeNickname(nickname);
      router.push(`/battle/${code}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create room.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <GenSelector
      selected={gens}
      onChange={setGens}
      onStart={handleCreate}
      loading={creating}
      error={createError}
      eyebrow={event ? event.label : "Battle a Friend"}
      title="Set the Rules"
      subtitle="Pick the pool everyone pulls from, then how the match plays out."
      cost={matchCost(packMode, gens)}
      costLabel="5 packs"
      buttonLabel="Create Room"
      loadingLabel="Creating room..."
      startDisabled={!isNicknameUsable(nickname)}
      back={event ? `/event/${event.slug}` : "/play"}
      eventBanner={event ? { label: event.label, gradient: event.gradient, image: event.image } : undefined}
      extraTop={
        <>
          <NicknameField value={nickname} onChange={setNickname} />
          <PlayerCountPicker value={maxPlayers} onChange={setMaxPlayers} />
          <PackModePicker value={packMode} onChange={setPackMode} />
          {maxPlayers >= MIN_VOTE_PLAYERS && <JudgeModePicker value={judgeMode} onChange={setJudgeMode} />}
        </>
      }
    />
  );
}

export default function BattlePage() {
  return (
    <Suspense fallback={null}>
      <CreateRoom />
    </Suspense>
  );
}
