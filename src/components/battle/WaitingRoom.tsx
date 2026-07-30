"use client";

import { useState } from "react";

interface Props {
  code: string;
}

export default function WaitingRoom({ code }: Props) {
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
      <div className="glass w-full max-w-sm rounded-[2rem] p-6 text-center shadow-2xl shadow-black/40">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-300/90">1v1 Battle</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Waiting for opponent...</h1>

        <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-400/10 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">Room Code</p>
          <p className="mt-1 text-4xl font-black tracking-[0.3em] text-white">{code}</p>
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-transform active:scale-[0.98]"
        >
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
