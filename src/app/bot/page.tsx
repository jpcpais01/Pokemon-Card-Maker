"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GenSelector from "@/components/GenSelector";
import JudgeModePicker from "@/components/battle/JudgeModePicker";
import PlayerCountPicker from "@/components/battle/PlayerCountPicker";
import UnlimitedRerollsToggle from "@/components/battle/UnlimitedRerollsToggle";
import { createRoom } from "@/lib/battle/api";
import { storePlayerId } from "@/lib/battle/session";
import { GENERATIONS } from "@/lib/generations";
import { MIN_VOTE_PLAYERS, type JudgeMode } from "@/lib/battle/types";

export default function BattleBotSetupPage() {
  const router = useRouter();
  const [gens, setGens] = useState<number[]>(GENERATIONS.map((g) => g.id));
  const [botPlayers, setBotPlayers] = useState(2);
  const [botJudgeMode, setBotJudgeMode] = useState<JudgeMode>("ai");
  const [botUnlimitedRerolls, setBotUnlimitedRerolls] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setError(null);
    setStarting(true);
    try {
      const effectiveJudgeMode = botPlayers >= MIN_VOTE_PLAYERS ? botJudgeMode : "ai";
      const { code, playerId } = await createRoom(gens, true, botPlayers, effectiveJudgeMode, botUnlimitedRerolls);
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
      eyebrow="Battle a Bot"
      title="Set Up Your Match"
      subtitle="Pick which generations can appear, how many players, and the match rules."
      buttonLabel="Start Match"
      loadingLabel="Starting match..."
      extraTop={
        <>
          <PlayerCountPicker value={botPlayers} onChange={setBotPlayers} label="Players (you + bots)" />
          {botPlayers >= MIN_VOTE_PLAYERS && <JudgeModePicker value={botJudgeMode} onChange={setBotJudgeMode} />}
          <UnlimitedRerollsToggle value={botUnlimitedRerolls} onChange={setBotUnlimitedRerolls} />
        </>
      }
      footer={
        <Link href="/" className="mt-4 block text-center text-sm font-semibold text-slate-400 active:text-white">
          ← All Modes
        </Link>
      }
    />
  );
}
