import { NextResponse } from "next/server";
import { generateText } from "@/lib/openrouter";
import { SYSTEM_PROMPT, buildStyleSuffix, buildUserPrompt, type PromptRequestBody } from "@/lib/promptBuilder";

export async function POST(request: Request) {
  let body: PromptRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !body?.artType?.label ||
    !body?.specialForm?.label ||
    !body?.vibe?.label ||
    !Array.isArray(body.pokemons) ||
    body.pokemons.length === 0
  ) {
    return NextResponse.json({ error: "Missing required selection fields." }, { status: 400 });
  }

  try {
    const userPrompt = buildUserPrompt(body);
    const draftedPrompt = await generateText(SYSTEM_PROMPT, userPrompt);
    const prompt = `${draftedPrompt}${buildStyleSuffix(body.pokemons.map((p) => p.name), body.specialForm.value)}`;
    return NextResponse.json({ prompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate prompt.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
