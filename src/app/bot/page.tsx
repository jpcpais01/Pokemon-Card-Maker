"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GenSelector from "@/components/GenSelector";
import JudgeModePicker from "@/components/battle/JudgeModePicker";
import PackModePicker from "@/components/battle/PackModePicker";
import PlayerCountPicker from "@/components/battle/PlayerCountPicker";
import UnlimitedRerollsToggle from "@/components/battle/UnlimitedRerollsToggle";
import { createRoom } from "@/lib/battle/api";
import { storePlayerId } from "@/lib/battle/session";
import { getEvent, parseEventTheme } from "@/lib/events";
import { GENERATIONS } from "@/lib/generations";
import { matchCost, spendTokens } from "@/lib/tokens";
import { MIN_VOTE_PLAYERS, type JudgeMode } from "@/lib/battle/types";
import { PACK_MODES, type PackMode } from "@/lib/types";

function parsePackMode(value: string | null): PackMode {
  return PACK_MODES.includes(value as PackMode) ? (value as PackMode) : "classic";
}

function BotSetup() {
  const router = useRouter();
  const params = useSearchParams();
  // An event hub hands off here with the theme (and the pack mode already chosen).
  const theme = parseEventTheme(params.get("theme"));
  const event = getEvent(theme);

  const [gens, setGens] = useState<number[]>(event ? event.defaultGens : GENERATIONS.map((g) => g.id));
  const [botPlayers, setBotPlayers] = useState(2);
  const [botJudgeMode, setBotJudgeMode] = useState<JudgeMode>("ai");
  const [botPackMode, setBotPackMode] = useState<PackMode>(parsePackMode(params.get("pack")));
  const [botUnlimitedRerolls, setBotUnlimitedRerolls] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setError(null);
    setStarting(true);
    try {
      const effectiveJudgeMode = botPlayers >= MIN_VOTE_PLAYERS ? botJudgeMode : "ai";
      // A match is five rounds and so five packs, charged up front.
      if (!spendTokens(matchCost(botPackMode, gens))) {
        throw new Error("Not enough tokens to start this match.");
      }
      const { code, playerId } = await createRoom(
        gens,
        true,
        botPlayers,
        effectiveJudgeMode,
        botUnlimitedRerolls,
        botPackMode,
        theme
      );
      storePlayerId(code, playerId);
      router.push(`/battle/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start match.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <GenSelector
      selected={gens}
      onChange={setGens}
      onStart={handleStart}
      loading={starting}
      error={error}
      eyebrow={event ? event.label : "Battle a Bot"}
      title="Set Up Your Match"
      subtitle="Pick the pool, how many players, and the match rules."
      cost={matchCost(botPackMode, gens)}
      costLabel="5 packs"
      buttonLabel="Start Match"
      loadingLabel="Starting match..."
      back={event ? `/event/${event.slug}` : "/play"}
      eventBanner={event ? { label: event.label, gradient: event.gradient, image: event.image } : undefined}
      extraTop={
        <>
          <PlayerCountPicker value={botPlayers} onChange={setBotPlayers} label="Players (you + bots)" />
          <PackModePicker value={botPackMode} onChange={setBotPackMode} />
          {botPlayers >= MIN_VOTE_PLAYERS && <JudgeModePicker value={botJudgeMode} onChange={setBotJudgeMode} />}
          <UnlimitedRerollsToggle value={botUnlimitedRerolls} onChange={setBotUnlimitedRerolls} />
        </>
      }
    />
  );
}

export default function BattleBotSetupPage() {
  return (
    <Suspense fallback={null}>
      <BotSetup />
    </Suspense>
  );
}
