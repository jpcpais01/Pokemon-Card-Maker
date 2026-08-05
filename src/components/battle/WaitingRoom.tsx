"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

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
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-10">
      <div className="card-raised pop-in w-full max-w-sm p-6 text-center">
        <p className="section-label text-amber-300/80">
          {maxPlayers > 2 ? `${maxPlayers}-Player Battle` : "1v1 Battle"}
        </p>
        <h1 className="font-display mt-2 text-2xl font-extrabold tracking-tight text-white">
          Waiting for players
        </h1>

        {/* Seat indicators - concrete "who's here" state instead of a bare count. */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: maxPlayers }, (_, i) => {
            const filled = i < playersJoined;
            return (
              <span
                key={i}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300 ${
                  filled
                    ? "border-amber-300/50 bg-amber-400/15 text-amber-300"
                    : "border-white/10 bg-white/[0.04] text-slate-600"
                }`}
              >
                <Icon name={filled ? "check" : "plus"} size={15} strokeWidth={2.6} />
              </span>
            );
          })}
        </div>
        <p className="mt-2 text-[12.5px] text-slate-400">
          {playersJoined} of {maxPlayers} joined
        </p>

        <div className="relative mt-6 overflow-hidden rounded-2xl border border-amber-300/25 bg-amber-400/[0.07] py-6">
          <div className="holo-sheen opacity-20" />
          <p className="section-label relative text-amber-300/70">Room Code</p>
          <p className="font-display relative mt-1.5 text-[2.75rem] font-black leading-none tracking-[0.3em] text-white">
            {code}
          </p>
        </div>

        <button type="button" onClick={copyLink} className="btn-primary mt-5 w-full">
          <Icon name={copied ? "check" : "share"} size={17} />
          {copied ? "Link copied!" : "Copy Invite Link"}
        </button>

        <div className="mt-6 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400" />
        </div>
      </div>
    </div>
  );
}
