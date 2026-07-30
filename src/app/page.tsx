"use client";

import { useMemo, useState } from "react";
import GenSelector from "@/components/GenSelector";
import RevealScreen, { type RevealData, type RevealFlags } from "@/components/RevealScreen";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";
import ResultScreen from "@/components/ResultScreen";
import { ART_TYPES, REGIONS, SPECIAL_FORMS, pickWeighted } from "@/lib/cardData";
import { GENERATIONS, fetchPokemonForGenerations, officialArtworkUrl, pickRandomPokemon, prettifyPokemonName } from "@/lib/generations";
import type { PokemonPick } from "@/lib/types";

type Stage = "setup" | "reveal" | "prompt" | "image" | "result" | "error";

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
  const [stage, setStage] = useState<Stage>("setup");
  const [gens, setGens] = useState<number[]>(GENERATIONS.map((g) => g.id));
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState<string | null>(null);

  const [revealData, setRevealData] = useState<RevealData | null>(null);
  const [flags, setFlags] = useState<RevealFlags | null>(null);

  const [promptText, setPromptText] = useState("");
  const [image, setImage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [failedStep, setFailedStep] = useState<"prompt" | "image">("prompt");
  const [regenerating, setRegenerating] = useState(false);

  const allRevealed = useMemo(() => {
    if (!flags) return false;
    return flags.artType && flags.specialForm && flags.region && flags.pokemons.every(Boolean);
  }, [flags]);

  async function handleOpenPack() {
    setPoolError(null);
    setPoolLoading(true);
    try {
      const pool = await fetchPokemonForGenerations(gens);
      if (pool.length === 0) throw new Error("No Pokemon found for the selected generations.");

      const artType = pickWeighted(ART_TYPES);
      const specialForm = pickWeighted(SPECIAL_FORMS);
      const region = pickWeighted(REGIONS);
      const count = specialForm.value === "tag-team" ? 2 : 1;

      const chosenIds: number[] = [];
      const pokemons: PokemonPick[] = [];
      for (let i = 0; i < count; i++) {
        const p = pickRandomPokemon(pool, chosenIds);
        chosenIds.push(p.id);
        pokemons.push({
          id: p.id,
          name: p.name,
          displayName: prettifyPokemonName(p.name),
          artworkUrl: officialArtworkUrl(p.id),
        });
      }

      setRevealData({ artType, specialForm, region, pokemons });
      setFlags({ artType: false, specialForm: false, region: false, pokemons: pokemons.map(() => false) });
      setStage("reveal");
    } catch (err) {
      setPoolError(err instanceof Error ? err.message : "Failed to load Pokemon data.");
    } finally {
      setPoolLoading(false);
    }
  }

  function handleReveal(key: "artType" | "specialForm" | "region" | number) {
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
    setFlags((prev) => (prev ? { artType: true, specialForm: true, region: true, pokemons: prev.pokemons.map(() => true) } : prev));
  }

  async function runGeneration(data: RevealData) {
    let generatedPrompt = "";
    try {
      setStage("prompt");
      const { prompt } = await postJson<{ prompt: string }>("/api/generate-prompt", {
        artType: { label: data.artType.label, blurb: data.artType.blurb },
        specialForm: { label: data.specialForm.label, blurb: data.specialForm.blurb },
        region: { label: data.region.label, blurb: data.region.blurb },
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

  if (stage === "setup") {
    return <GenSelector selected={gens} onChange={setGens} onStart={handleOpenPack} loading={poolLoading} error={poolError} />;
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
