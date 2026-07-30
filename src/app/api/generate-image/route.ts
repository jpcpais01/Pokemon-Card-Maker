import { NextResponse } from "next/server";
import { generateImage } from "@/lib/openrouter";

export async function POST(request: Request) {
  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.prompt || typeof body.prompt !== "string") {
    return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
  }

  try {
    const image = await generateImage(body.prompt);
    return NextResponse.json({ image });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate image.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
