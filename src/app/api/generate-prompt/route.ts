import { NextResponse } from "next/server";
import { generateText } from "@/lib/openrouter";
import { SYSTEM_PROMPT, buildUserPrompt, type PromptRequestBody } from "@/lib/promptBuilder";

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
    !body?.region?.label ||
    !Array.isArray(body.pokemons) ||
    body.pokemons.length === 0
  ) {
    return NextResponse.json({ error: "Missing required selection fields." }, { status: 400 });
  }

  try {
    const userPrompt = buildUserPrompt(body);
    const prompt = await generateText(SYSTEM_PROMPT, userPrompt);
    return NextResponse.json({ prompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate prompt.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
