"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GenSelector from "@/components/GenSelector";
import JudgeModePicker from "@/components/battle/JudgeModePicker";
import PlayerCountPicker from "@/components/battle/PlayerCountPicker";
import UnlimitedRerollsToggle from "@/components/battle/UnlimitedRerollsToggle";
import RevealScreen, { type CardKey, type RevealData, type RevealFlags } from "@/components/RevealScreen";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";
import ResultScreen from "@/components/ResultScreen";
import { ART_TYPES, VIBES, pickSpecialForm, pickWeighted } from "@/lib/cardData";
import { createRoom } from "@/lib/battle/api";
import { getFavorites } from "@/lib/favorites";
import { storePlayerId } from "@/lib/battle/session";
import { GENERATIONS, fetchPokemonForGenerations, pickRandomPokemon, toPokemonPick } from "@/lib/generations";
import { MIN_VOTE_PLAYERS, type JudgeMode } from "@/lib/battle/types";
import type { PokemonRef } from "@/lib/types";

type Stage = "setup" | "reveal" | "prompt" | "image" | "result" | "error";

const TOTAL_REROLLS = 5;

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

export default function Home() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("setup");
  const [gens, setGens] = useState<number[]>(GENERATIONS.map((g) => g.id));
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState<string | null>(null);

  const [startingBot, setStartingBot] = useState(false);
  const [botError, setBotError] = useState<string | null>(null);
  const [botPlayers, setBotPlayers] = useState(2);
  const [botJudgeMode, setBotJudgeMode] = useState<JudgeMode>("ai");
  const [botUnlimitedRerolls, setBotUnlimitedRerolls] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    // Deferred so reading localStorage (unavailable during SSR) happens in a callback, not the effect body itself.
    const timeout = window.setTimeout(() => setFavoriteCount(getFavorites().length), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const [pool, setPool] = useState<PokemonRef[]>([]);
  const [revealData, setRevealData] = useState<RevealData | null>(null);
  const [flags, setFlags] = useState<RevealFlags | null>(null);
  const [rerollsLeft, setRerollsLeft] = useState(TOTAL_REROLLS);

  const [promptText, setPromptText] = useState("");
  const [image, setImage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [failedStep, setFailedStep] = useState<"prompt" | "image">("prompt");
  const [regenerating, setRegenerating] = useState(false);

  const allRevealed = useMemo(() => {
    if (!flags) return false;
    return flags.artType && flags.specialForm && flags.vibe && flags.pokemons.every(Boolean);
  }, [flags]);

  async function handleOpenPack() {
    setPoolError(null);
    setPoolLoading(true);
    try {
      const fetchedPool = await fetchPokemonForGenerations(gens);
      if (fetchedPool.length === 0) throw new Error("No Pokemon found for the selected generations.");

      const artType = pickWeighted(ART_TYPES);
      const specialForm = pickSpecialForm(fetchedPool.length);
      const vibe = pickWeighted(VIBES);
      const count = specialForm.value === "tag-team" ? 2 : 1;

      const chosenIds: number[] = [];
      const pokemons = [];
      for (let i = 0; i < count; i++) {
        const p = pickRandomPokemon(fetchedPool, chosenIds);
        chosenIds.push(p.id);
        pokemons.push(toPokemonPick(p));
      }

      setPool(fetchedPool);
      setRevealData({ artType, specialForm, vibe, pokemons });
      setFlags({ artType: false, specialForm: false, vibe: false, pokemons: pokemons.map(() => false) });
      setRerollsLeft(TOTAL_REROLLS);
      setStage("reveal");
    } catch (err) {
      setPoolError(err instanceof Error ? err.message : "Failed to load Pokemon data.");
    } finally {
      setPoolLoading(false);
    }
  }

  function handleReveal(key: CardKey) {
    setFlags((prev) => {
      if (!prev) return prev;
      if (typeof key === "number") {
        const pokemons = [...prev.pokemons];
        pokemons[key] = true;
        return { ...prev, pokemons };
      }
      return { ...prev, [key]: true };
    });
  }

  function handleRevealAll() {
    setFlags((prev) =>
      prev ? { artType: true, specialForm: true, vibe: true, pokemons: prev.pokemons.map(() => true) } : prev
    );
  }

  function handleReroll(key: CardKey) {
    if (rerollsLeft <= 0) return;
    setRerollsLeft((n) => n - 1);

    if (key === "artType") {
      setRevealData((prev) => (prev ? { ...prev, artType: pickWeighted(ART_TYPES, prev.artType.value) } : prev));
      return;
    }

    if (key === "vibe") {
      setRevealData((prev) => (prev ? { ...prev, vibe: pickWeighted(VIBES, prev.vibe.value) } : prev));
      return;
    }

    if (key === "specialForm") {
      setRevealData((prev) => {
        if (!prev) return prev;
        const specialForm = pickSpecialForm(pool.length, prev.specialForm.value);
        const wasTagTeam = prev.specialForm.value === "tag-team";
        const isTagTeam = specialForm.value === "tag-team";

        let pokemons = prev.pokemons;
        if (isTagTeam && !wasTagTeam) {
          const extra = pickRandomPokemon(pool, prev.pokemons.map((p) => p.id));
          pokemons = [...prev.pokemons, toPokemonPick(extra)];
          setFlags((f) => (f ? { ...f, pokemons: [...f.pokemons, true] } : f));
        } else if (!isTagTeam && wasTagTeam) {
          pokemons = prev.pokemons.slice(0, 1);
          setFlags((f) => (f ? { ...f, pokemons: f.pokemons.slice(0, 1) } : f));
        }

        return { ...prev, specialForm, pokemons };
      });
      return;
    }

    // Pokemon slot reroll: pick a fresh one, never duplicating the other tag-team slot.
    setRevealData((prev) => {
      if (!prev) return prev;
      const excludeIds = prev.pokemons.map((p) => p.id);
      const fresh = pickRandomPokemon(pool, excludeIds);
      const pokemons = [...prev.pokemons];
      pokemons[key] = toPokemonPick(fresh);
      return { ...prev, pokemons };
    });
  }

  async function runGeneration(data: RevealData) {
    let generatedPrompt = "";
    try {
      setStage("prompt");
      const { prompt } = await postJson<{ prompt: string }>("/api/generate-prompt", {
        artType: { label: data.artType.label, blurb: data.artType.blurb },
        specialForm: { label: data.specialForm.label, blurb: data.specialForm.blurb },
        vibe: { label: data.vibe.label, blurb: data.vibe.blurb },
        pokemons: data.pokemons.map((p) => ({ name: p.displayName })),
      });
      generatedPrompt = prompt;
      setPromptText(prompt);

      setStage("image");
      const { image: img } = await postJson<{ image: string }>("/api/generate-image", { prompt });
      setImage(img);
      setStage("result");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setFailedStep(generatedPrompt ? "image" : "prompt");
      setStage("error");
    }
  }

  function handleGenerate() {
    if (!revealData) return;
    setPromptText("");
    void runGeneration(revealData);
  }

  function handleRetry() {
    if (!revealData) return;
    if (failedStep === "image" && promptText) {
      setStage("image");
      postJson<{ image: string }>("/api/generate-image", { prompt: promptText })
        .then(({ image: img }) => {
          setImage(img);
          setStage("result");
        })
        .catch((err) => {
          setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
          setFailedStep("image");
          setStage("error");
        });
      return;
    }
    void runGeneration(revealData);
  }

  async function handleRegenerateImage() {
    if (!promptText) return;
    setRegenerating(true);
    try {
      const { image: img } = await postJson<{ image: string }>("/api/generate-image", { prompt: promptText });
      setImage(img);
    } catch {
      // Keep the existing artwork visible if a regeneration attempt fails.
    } finally {
      setRegenerating(false);
    }
  }

  function handleStartOver() {
    setRevealData(null);
    setFlags(null);
    setPromptText("");
    setImage("");
    setErrorMessage("");
    setStage("setup");
  }

  async function handleBattleBot() {
    setBotError(null);
    setStartingBot(true);
    try {
      const effectiveJudgeMode = botPlayers >= MIN_VOTE_PLAYERS ? botJudgeMode : "ai";
      const { code, playerId } = await createRoom(gens, true, botPlayers, effectiveJudgeMode, botUnlimitedRerolls);
      storePlayerId(code, playerId);
      router.push(`/battle/${code}`);
    } catch (err) {
      setBotError(err instanceof Error ? err.message : "Failed to start match.");
    } finally {
      setStartingBot(false);
    }
  }

  if (stage === "setup") {
    return (
      <GenSelector
        selected={gens}
        onChange={setGens}
        onStart={handleOpenPack}
        loading={poolLoading}
        error={poolError}
        footer={
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/battle" className="block text-center text-sm font-semibold text-slate-400 active:text-amber-300">
              Battle a friend
            </Link>
            <Link href="/gallery" className="block text-center text-sm font-semibold text-slate-400 active:text-amber-300">
              ★ My Binder{favoriteCount > 0 ? ` (${favoriteCount})` : ""}
            </Link>
            <PlayerCountPicker value={botPlayers} onChange={setBotPlayers} label="Bot match players" />
            {botPlayers >= MIN_VOTE_PLAYERS && (
              <JudgeModePicker value={botJudgeMode} onChange={setBotJudgeMode} />
            )}
            <UnlimitedRerollsToggle value={botUnlimitedRerolls} onChange={setBotUnlimitedRerolls} />
            <button
              type="button"
              onClick={handleBattleBot}
              disabled={startingBot}
              className="mt-1 block text-center text-sm font-semibold text-slate-400 active:text-amber-300 disabled:opacity-50"
            >
              {startingBot ? "Starting match..." : "Play vs Bot"}
            </button>
            {botError && <p className="text-center text-xs text-red-300">{botError}</p>}
          </div>
        }
      />
    );
  }

  if (stage === "reveal" && revealData && flags) {
    return (
      <RevealScreen
        data={revealData}
        flags={flags}
        onReveal={handleReveal}
        allRevealed={allRevealed}
        onRevealAll={handleRevealAll}
        onGenerate={handleGenerate}
        onBack={handleStartOver}
        rerollsLeft={rerollsLeft}
        onReroll={handleReroll}
      />
    );
  }

  if (stage === "prompt") {
    return <LoadingScreen key="prompt" message="Studying your traits and drafting the art direction..." />;
  }

  if (stage === "image") {
    return <LoadingScreen key="image" message="Painting the final illustration..." />;
  }

  if (stage === "error") {
    return <ErrorScreen message={errorMessage} onRetry={handleRetry} onStartOver={handleStartOver} />;
  }

  if (stage === "result" && revealData) {
    return (
      <ResultScreen
        image={image}
        prompt={promptText}
        data={revealData}
        onRegenerateImage={handleRegenerateImage}
        onStartOver={handleStartOver}
        regenerating={regenerating}
      />
    );
  }

  return null;
}
