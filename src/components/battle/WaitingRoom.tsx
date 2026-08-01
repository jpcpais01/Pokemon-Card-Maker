"use client";

import { useState } from "react";

interface Props {
  code: string;
  playersJoined: number;
  maxPlayers: number;
}

export default function WaitingRoom({ code, playersJoined, maxPlayers }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      const url = `${window.location.origin}/battle/${code}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can fail (e.g. insecure context) - the code is still visible to copy manually.
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="glass-strong rise-in w-full max-w-sm rounded-[2rem] p-6 text-center shadow-2xl shadow-black/40">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-300/90">
          {maxPlayers > 2 ? `${maxPlayers}-Player Battle` : "1v1 Battle"}
        </p>
        <h1 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-white">
          {playersJoined} of {maxPlayers} joined...
        </h1>

        <div className="relative mt-6 overflow-hidden rounded-2xl border border-amber-300/30 bg-amber-400/10 py-6">
          <div className="holo-sheen opacity-25" />
          <p className="relative text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">Room Code</p>
          <p className="relative mt-1 text-4xl font-black tracking-[0.3em] text-white">{code}</p>
        </div>

        <button type="button" onClick={copyLink} className="btn-primary mt-5 w-full transition-transform active:scale-[0.98]">
          {copied ? "Link copied!" : "Copy Invite Link"}
        </button>

        <div className="mt-6 flex items-center justify-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400" />
        </div>
      </div>
    </div>
  );
}
