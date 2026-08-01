"use client";

import { useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";

interface Props {
  images: (string | null)[];
  myVote: number | null;
  votedCount: number;
  totalVoters: number;
  busy: boolean;
  onVote: (slot: number) => void;
}

/**
 * The anonymous ballot for "vote" judge mode - card identities are never sent to the client here
 * (see /api/battle/vote-image), and slot order is independently shuffled per player and per round
 * in buildVoteOrders, so nobody can tell whose card is whose from the layout alone.
 */
export default function VotingPanel({ images, myVote, votedCount, totalVoters, busy, onVote }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [fullViewSrc, setFullViewSrc] = useState<string | null>(null);
  const hasVoted = myVote !== null;
  const activeSlot = hasVoted ? myVote : selected;

  return (
    <div>
      <p className="mb-4 text-center text-xs font-semibold text-slate-400">
        Vote for your favorite card - not your own! Tap a selected card again for a full view.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {images.map((image, slot) => {
          const isActive = activeSlot === slot;
          return (
            <button
              key={slot}
              type="button"
              disabled={hasVoted || busy}
              onClick={() => {
                if (selected === slot && image) {
                  setFullViewSrc(image);
                } else {
                  setSelected(slot);
                }
              }}
              className={`overflow-hidden rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] disabled:active:scale-100 ${
                isActive ? "border-amber-300 shadow-[0_0_24px_-4px_rgba(251,191,36,0.6)]" : "border-white/10"
              }`}
            >
              <div className="relative aspect-[3/4] w-full bg-black/30">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={`Card ${slot + 1}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">Loading...</div>
                )}
                {hasVoted && isActive && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-900">
                    YOUR VOTE
                  </span>
                )}
                {!hasVoted && isActive && image && (
                  <span className="glass absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white">
                    ⤢
                  </span>
                )}
              </div>
              <div className="bg-slate-900/90 px-2 py-2 text-center">
                <p className="text-xs font-bold text-white">Card {slot + 1}</p>
              </div>
            </button>
          );
        })}
      </div>

      {hasVoted ? (
        <p className="mt-6 text-center text-sm font-medium text-slate-300">
          Waiting for other players... ({votedCount} of {totalVoters} voted)
        </p>
      ) : (
        <button
          type="button"
          onClick={() => selected !== null && onVote(selected)}
          disabled={selected === null || busy}
          className="btn-primary mt-6 w-full transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          Cast Vote
        </button>
      )}

      {fullViewSrc && (
        <ImageLightbox src={fullViewSrc} alt="Full size candidate artwork" onClose={() => setFullViewSrc(null)} />
      )}
    </div>
  );
}
