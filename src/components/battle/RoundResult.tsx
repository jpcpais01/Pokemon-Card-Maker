import type { BattleRound } from "@/lib/battle/types";

interface Props {
  round: BattleRound;
  myId: string;
  opponentId: string;
  myImage: string | null;
  opponentImage: string | null;
  isLastRound: boolean;
  myReady: boolean;
  opponentReady: boolean;
  readyBusy: boolean;
  onReady: () => void;
}

export default function RoundResult({
  round,
  myId,
  opponentId,
  myImage,
  opponentImage,
  isLastRound,
  myReady,
  opponentReady,
  readyBusy,
  onReady,
}: Props) {
  const iWon = round.winnerId === myId;
  const myPick = round.players[myId];
  const opponentPick = round.players[opponentId];

  return (
    <div>
      <p className="text-center text-sm font-bold text-amber-300">
        {iWon ? "🏆 You won this round!" : "This round goes to your opponent."}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <ResultCard
          label="You"
          name={myPick.pokemons.map((p) => p.displayName).join(" & ")}
          image={myImage}
          winner={iWon}
        />
        <ResultCard
          label="Opponent"
          name={opponentPick.pokemons.map((p) => p.displayName).join(" & ")}
          image={opponentImage}
          winner={!iWon}
        />
      </div>

      {round.verdict && (
        <p className="glass mt-4 rounded-xl p-3 text-center text-xs italic leading-relaxed text-slate-300">
          &ldquo;{round.verdict}&rdquo;
        </p>
      )}

      <button
        type="button"
        onClick={onReady}
        disabled={myReady || readyBusy}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {myReady
          ? opponentReady
            ? "Continuing..."
            : "Waiting for opponent..."
          : isLastRound
            ? "See Final Results"
            : "Next Round"}
      </button>
    </div>
  );
}

function ResultCard({
  label,
  name,
  image,
  winner,
}: {
  label: string;
  name: string;
  image: string | null;
  winner: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border-2 ${
        winner ? "border-amber-300 shadow-[0_0_24px_-4px_rgba(251,191,36,0.6)]" : "border-white/10"
      }`}
    >
      <div className="relative aspect-[3/4] bg-black/30">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">Loading...</div>
        )}
        {winner && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-900">
            WIN
          </span>
        )}
      </div>
      <div className="bg-slate-900/90 px-2 py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-xs font-bold text-white">{name}</p>
      </div>
    </div>
  );
}
